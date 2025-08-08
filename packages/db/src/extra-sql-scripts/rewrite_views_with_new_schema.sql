CREATE OR REPLACE PROCEDURE rewrite_views_with_new_schema(
    old_schema TEXT,
    new_schema TEXT,
    is_dry_run BOOLEAN DEFAULT TRUE,
    views_schemas TEXT[] DEFAULT ARRAY['public']
)
LANGUAGE plpgsql
AS $$
DECLARE
    v RECORD;
    new_def TEXT;
BEGIN
    FOR v IN
        SELECT schemaname, viewname, definition
        FROM pg_views
        WHERE schemaname = ANY(views_schemas) AND (definition ILIKE '%' || old_schema || '.%' OR definition ILIKE '%"' || old_schema || '".%')
    LOOP
        -- Replace old schema with new schema in the view definition
        new_def := REPLACE(
            REPLACE(v.definition, old_schema || '.', new_schema || '.'),
             '"' || old_schema || '".', '"' || new_schema || '".'
        );

        IF is_dry_run THEN
            RAISE NOTICE 'Would replace view %.% with: %',
                v.schemaname, v.viewname, new_def;
        ELSE
            EXECUTE format('CREATE OR REPLACE VIEW %I.%I AS %s',
                v.schemaname, v.viewname, new_def);
        END IF;
    END LOOP;
END;
$$;