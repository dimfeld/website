---
title: PostgreSQL Cheat Sheet
date: 2020-03-03
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
