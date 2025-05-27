-- Custom SQL migration file, put your code below! --

CREATE OR REPLACE FUNCTION flatten_jsonb_array(arr jsonb) 
RETURNS jsonb AS $$
WITH RECURSIVE flatten AS (
    SELECT elem FROM jsonb_array_elements(arr) AS elem
    UNION ALL
    SELECT jsonb_array_elements(elem) FROM flatten
    WHERE jsonb_typeof(elem) = 'array'
)
SELECT jsonb_agg(elem) FROM flatten
WHERE jsonb_typeof(elem) != 'array';
$$ LANGUAGE SQL IMMUTABLE; --> statement breakpoint

-- State transition: Accumulate flattened elements
CREATE FUNCTION aggregate_flatten(state jsonb, new_arr jsonb)
RETURNS jsonb AS $$
BEGIN
    RETURN state || flatten_jsonb_array(new_arr);
END;
$$ LANGUAGE plpgsql IMMUTABLE; --> statement breakpoint

-- Final function: Remove duplicates
CREATE FUNCTION final_flatten_distinct(state jsonb)
RETURNS jsonb AS $$
SELECT jsonb_agg(DISTINCT value)
FROM jsonb_array_elements(state);
$$ LANGUAGE SQL IMMUTABLE; --> statement breakpoint

-- Aggregate definition
CREATE AGGREGATE jsonb_flatten_agg(jsonb) (
    SFUNC = aggregate_flatten,
    STYPE = jsonb,
    FINALFUNC = final_flatten_distinct,
    INITCOND = '[]'
); --> statement breakpoint
