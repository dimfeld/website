---
title: PostgreSQL Cheat Sheet
date: 2020-03-03
updated: 2020-03-06
---

Also see [PostgreSQL CLI Cheat Sheet](psql).

# Triggers

[Full Documentation](https://www.postgresql.org/docs/current/sql-createtrigger.html)

Here's an example that updates a row's timestamp whenever a query updates the row without changing the timestamp.

```sql
CREATE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = now();
    RETURN new;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_timestamp_trigger BEFORE UPDATE
    ON the_table
    FOR EACH ROW
    WHEN (NEW.updated IS NOT DISTINCT FROM OLD.updated
       OR NEW.updated IS NULL)
    EXECUTE FUNCTION update_timestamp();
```

The operation can be one of `UPDATE`, `INSERT`, OR `DELETE`. Triggers can execute `BEFORE` or `AFTER` the operation, and can run `FOR EACH ROW`, or once for the query using `FOR EACH STATEMENT`.

In a function called per row, the function can reference the original and new row values as `OLD` and `NEW`. The values can be modified directly in the function, and then the row returned by the function will become the new value.

# Indexing and matching on JSON values inside an array

Imagine you have a JSONB field that is an array of objects, and you want to match on rows where any value of the array fits your criteria. In my particular case, it looked similar to `[{"matches": [1, 2, 3], ...otherData }, {"matches": [2, 3, 4], ...otherData}]`.

Fortunately, PostgreSQL's JSON support is top-notch and this is actually very easy. The `A @> B` operator can check if value A "contains" value B. For arrays, you can think of this as more of an _overlap_ than strict containment. If your array criteria has more than one item, they are checked individually against the source data and each one must match.

```sql
-- At least one item in the array overlaps with the criteria, so
-- this is true.
select '[{"a": [2, 3, 4]}, {"a": [1, 2, 3]}]'::jsonb @>
       '[{"a":[3, 4]}]'::jsonb as matches;
 matches
---------
 t

-- When matching against arrays, the match criteria must also be
-- an array. Again, think overlap more than containment.
select '[{"a": [2, 3, 4]}, {"a": [1, 2, 3]}]'::jsonb @>
       '{"a":[3, 4]}'::jsonb as matches;
 matches
---------
 t

-- Order of items in the array does not matter.
select '[{"a": [2, 3, 4]}, {"a": [1, 2, 3]}]'::jsonb @>
       '[{"a":[4, 3]}]'::jsonb as matches;
 matches
---------
 t

-- Here we match against an array item where the array doesn't
-- overlap, so it's false.
select '[{"a": [2, 3, 4]}, {"a": [1, 2, 3]}]'::jsonb @>
       '[{"a":[4,5]}]'::jsonb as matches;
 matches
---------
 f

-- Array items are matched individually, so here there are
-- two array items [4] and they both overlap with the same
-- array [2,3,4]. Postgres calls this a match.
select '[{"a": [2, 3, 4]}, {"a": [1, 2, 3]}]'::jsonb @>
       '[{"a":[4]}, {"a":[4]}]'::jsonb as matches;
 matches
---------
 t

-- And here one of the array items matches but the other
-- does not, so it's false.
select '[{"a": [2, 3, 4]}, {"a": [1, 2, 3]}]'::jsonb @>
       '[{"a":[4]}, {"a":[5]}]'::jsonb as matches;
 matches
---------
 f
```

Finally, to make it fast in a real application, just create a GIN index on the entire column.

```
CREATE INDEX ON table USING GIN (data_column);
```

And if you only need the `@>`, `@@`, and `@?` operators, you can specify `jsonb_path_ops` to make the index faster and smaller.

```
CREATE INDEX ON table USING GIN (data_column jsonb_path_ops);
```

The [PostgreSQL documentation](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING) provides a thorough and easy-to-read discussion of the tradeoffs between the two types of indexes.
