CREATE OR REPLACE FUNCTION array_lowercase(text[]) RETURNS text[] AS $$  
SELECT CASE  
  WHEN $1 IS NULL THEN NULL  
  ELSE ARRAY(  
    SELECT lower(elem)  
    FROM unnest($1) WITH ORDINALITY AS u(elem, ordinality)  
    ORDER BY ordinality  
  )  
END;  
$$ LANGUAGE SQL IMMUTABLE; --> statement breakpoint  
  
CREATE OR REPLACE FUNCTION array_uppercase(text[]) RETURNS text[] AS $$  
SELECT CASE  
  WHEN $1 IS NULL THEN NULL  
  ELSE ARRAY(  
    SELECT upper(elem)  
    FROM unnest($1) WITH ORDINALITY AS u(elem, ordinality)  
    ORDER BY ordinality  
  )  
END;  
$$ LANGUAGE SQL IMMUTABLE; --> statement breakpoint  