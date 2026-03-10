-- Counts how many consecutive items match between two text arrays,
-- either from the start or from the end.
--
-- Examples:
--   string_array_match_count(ARRAY['a','b'], ARRAY['a','b','c'], 'start') = 2
--   string_array_match_count(ARRAY['x','b','c'], ARRAY['a','b','c'], 'end') = 2
CREATE OR REPLACE FUNCTION string_array_match_count(
    arr1 text[],
    arr2 text[],
    direction text
) RETURNS integer AS $$
DECLARE
    -- Number of matching items found so far.
    count integer := 0;

    -- Length of each array.
    len1 integer := array_length(arr1, 1);
    len2 integer := array_length(arr2, 1);

    -- Loop counter.
    i integer;
BEGIN
    -- Compare from the first element forward.
    IF direction = 'start' THEN
        FOR i IN 1..LEAST(len1, len2) LOOP
            IF arr1[i] = arr2[i] THEN
                count := count + 1;
            ELSE
                EXIT;
            END IF;
        END LOOP;

    -- Compare from the last element backward.
    ELSIF direction = 'end' THEN
        FOR i IN 1..LEAST(len1, len2) LOOP
            IF arr1[len1 - i + 1] = arr2[len2 - i + 1] THEN
                count := count + 1;
            ELSE
                EXIT;
            END IF;
        END LOOP;

    -- Reject invalid direction values.
    ELSE
        RAISE EXCEPTION 'Invalid direction: use start or end';
    END IF;

    RETURN count;
END;
$$ LANGUAGE plpgsql;


-- Converts a dotted DNS-style name into a lowercase text array of labels.
--
-- Special case:
--   If the first label is '@', it is removed.
--
-- Examples:
--   dns_labels_from_text('www.example.com') = {www,example,com}
--   dns_labels_from_text('@.example.com')   = {example,com}
CREATE OR REPLACE FUNCTION dns_labels_from_text(input_name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
RETURNS NULL ON NULL INPUT
RETURN
  CASE
    WHEN split_part(lower(input_name), '.', 1) = '@'
      THEN (string_to_array(lower(input_name), '.'))[2:]
    ELSE
      string_to_array(lower(input_name), '.')
  END;


-- Converts an array of text parts into DNS labels by:
--   1. joining the parts with dots
--   2. delegating to dns_labels_from_text(...)
--
-- Examples:
--   dns_labels_from_text_array(ARRAY['www','example','com']) = {www,example,com}
--   dns_labels_from_text_array(ARRAY['@','example','com'])   = {example,com}
CREATE OR REPLACE FUNCTION dns_labels_from_text_array(parts text[])
RETURNS text[]
LANGUAGE sql
IMMUTABLE
RETURNS NULL ON NULL INPUT
RETURN
  dns_labels_from_text(array_to_string(parts, '.'));


-- Returns true if both label arrays are exactly equal.
--
-- Examples:
--   labels_exact_match({a,b}, {a,b}) = true
--   labels_exact_match({a,b}, {a,c}) = false
CREATE OR REPLACE FUNCTION labels_exact_match(a text[], b text[])
RETURNS boolean AS $$
BEGIN
  RETURN a = b;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Returns true if both names are an apex match,
-- meaning every label matches exactly.
--
-- This currently delegates to labels_exact_match(...) so that
-- the exact-match logic lives in one place.
CREATE OR REPLACE FUNCTION is_apex_match(a text[], b text[])
RETURNS boolean AS $$
BEGIN
  RETURN labels_exact_match(a, b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Returns true if two names are immediate siblings.
--
-- Immediate siblings must:
--   1. have the same number of labels
--   2. match on all labels except the first one
--   3. differ on the first one
--
-- Because DNS hierarchy is right-to-left, examples:
--   foo.example.com and bar.example.com are immediate siblings
--   a.b.example.com and c.b.example.com are immediate siblings
--
-- Note:
--   With arrays ordered left-to-right like {foo,example,com},
--   "all except the first label" means comparing slices [2:].
CREATE OR REPLACE FUNCTION is_immediate_sibling(a text[], b text[])
RETURNS boolean AS $$
BEGIN
  RETURN array_length(a, 1) = array_length(b, 1)
         AND a[2:array_length(a, 1)] = b[2:array_length(b, 1)]
         AND a[1] <> b[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- Returns true if the second name (b) is a descendant of the first name (a).
--
-- Direction is explicit:
--   a = ancestor / parent candidate
--   b = descendant candidate
--
-- This means:
--   1. b must have more labels than a
--   2. the tail of b must exactly match all labels of a
--
-- Examples:
--   is_second_descendant_of_first({example,com}, {www,example,com}) = true
--   is_second_descendant_of_first({example,com}, {example,com})     = false
--   is_second_descendant_of_first({a,example,com}, {b,example,com}) = false
CREATE OR REPLACE FUNCTION is_second_descendant_of_first(a text[], b text[])
RETURNS boolean AS $$
BEGIN
  RETURN array_length(b, 1) > array_length(a, 1)
         AND b[(array_length(b, 1) - array_length(a, 1) + 1):array_length(b, 1)] = a;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
