CREATE OR REPLACE PROCEDURE create_constant_function(
    fn_name TEXT,
    return_type TEXT,
    const_literal TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    sql TEXT;
    value_expr TEXT;
    type_cat CHAR;
    resolved_oid OID;
    resolved_type TEXT;
BEGIN
    -- Resolve type name to oid using SQL-standard aliases (e.g., TEXT, INTEGER)
    SELECT oid, typcategory, format_type(oid, NULL)
    INTO resolved_oid, type_cat, resolved_type
    FROM pg_type
    WHERE oid = to_regtype(return_type);

    IF resolved_oid IS NULL THEN
        RAISE EXCEPTION 'Invalid type: %', return_type;
    END IF;

    -- Quote literal only if typcategory is string (S)
    IF type_cat = 'S' THEN
        value_expr := quote_literal(const_literal);
    ELSE
        value_expr := const_literal;
    END IF;

    sql := format($f$
        CREATE OR REPLACE FUNCTION %I()
        RETURNS %s
        LANGUAGE plpgsql
        AS $func$
        BEGIN
            RETURN %s::%s;
        END;
        $func$;
    $f$, fn_name, resolved_type, value_expr, resolved_type);

    EXECUTE sql;
END;
$$;