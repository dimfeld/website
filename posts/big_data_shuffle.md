---
title: Reducing Big Data Shuffle by Substituting Integers for Strings
date: 2021-06-21
tags: SQL
cardImage: bq-shuffle-bytes.png
---

Recently I was working on a BigQuery job that reads in 2.6 billion rows, finds relationships between them, runs some `GROUP BY` statements, and generates 20 billion rows from that. This was too much for BigQuery, which cancelled the job with this error:

```
Resources exceeded during query execution: Your project or organization exceeded the maximum disk and memory limit available for shuffle operations. Consider provisioning more slots, reducing query concurrency, or using more efficient logic in this job.
```

The really painful part of trying to work around this is that it took about 20 minutes for the query to fail each time. And "provisioning more slots" is shorthand for paying Google a bunch of money. After various attempts to massage the query into a form that BigQuery would run, I finally came upon the solution.

Two of the columns in this data are extremely long strings, 64 and 128 characters respectively, and I had to use both of them as `GROUP BY` keys at different points in the query. Behind the scenes, a distributed `GROUP BY` requires moving all the data for a set of grouping keys to the same set of processing nodes. This is called a "shuffle" or a "repartition," and with this much data we're talking multiple TB of data moving around the system.

![Lots of bytes shuffled](bq-shuffle-bytes.png)

Of course (in retrospect), the best way to reduce the data to be shuffled around is not to rearrange the queries, but to reduce the amount of data there is. And while a string takes up one byte per ASCII character plus two bytes to track the length, a 64-bit integer is always just 64 bits.

Using integers instead of strings saves 58 and 122 bytes per column for the two fields, a huge reduction. And indeed this was the solution to getting the query to run. The conversion looks something like this.

```sql
WITH
claim_numbers AS (
  -- Assign a number to each claim.
  SELECT ROW_NUMBER() OVER () AS id, claim_id
  FROM claims_table
  GROUP BY claim_id
),
patient_numbers AS (
  -- Assign a number to each patient.
  SELECT ROW_NUMBER() OVER () AS id, patient_id
  FROM claims_table
  GROUP BY patient_id
),
claims AS (
  -- Substitutes the integers
  SELECT cn.id AS claim_id, pn.id AS patient_id, other_columns
  FROM claims_table
  JOIN claim_numbers cn USING(claim_id)
  JOIN patient_numbers pn USING(patient_id)
),
other_ctes AS (...)
-- And then you can join on claim_numbers and patient_numbers again
-- if you need to restore the strings.
```

Not only does this technique work well for reducing shuffling, but it also speeds up large queries a lot too.

Sometimes, though, this doesn't quite work. Depending on how the data is read, Bigquery may fail in the `ROW_NUMBER` calculation with an error like this:

```
Resources exceeded during query execution:
The query could not be executed in the allotted memory.
Peak usage: 158% of limit.
Top memory consumer(s): analytic OVER() clauses: 100%
```

The `OVER` clause requires Bigquery to run the entire dataset through a single processing node, which can require more RAM than the node has. But there's another trick we can use.

If we partition the dataset by some other key that correlates with the ID, then each of those partitions can run through a different node and we can avoid RAM issues. In my case, there was a `patient_geo` column which represents roughly where each patient is from.

```sql
SELECT patient_id,
  ROW_NUMBER() OVER(PARTITION BY MAX(patient_geo)) AS id
FROM claims
GROUP BY patient_id
```

This works, but now we have duplicate IDs! Each partition ends up with its own set of IDs, and they overlap with each other. So we need one last adjustment.

Since each partition is based on the `patient_geo` column, we can integrate that into our id as well to avoid overlap. The output is a 64-bit integer, which gives us plenty of space. We know there will never be more than 100 billion patients, and so for each column, we multiply `patient_geo` by 100 billion and add it to the `ROW_NUMBER` for each row. A bit shift would work here too, but it doesn't really matter.

```sql
 SELECT patient_id,
	-- We know there will never be more than 100 billion patients,
    -- so shift the partition key up by that much.
	(MAX(patient_geo) * 100000000000)
    	+ ROW_NUMBER()
          OVER(PARTITION BY MAX(patient_geo)) AS id
  FROM claims
  GROUP BY patient_id
```

And there we go! As before, at the end of the query you can join on these results again to convert the numeric IDs back into real IDs, if necessary.

I don't recommend doing this if you don't have to. It does add some amount of complexity to the query, but it can be a lifesaver in cases where your SQL engine is running into issues.
