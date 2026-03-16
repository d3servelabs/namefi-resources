<!doctype html>
<html>
    <head>
        <title>{{ .Campaign.Subject }}</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
        <base target="_blank">
        <style>
            body {
                background-color: #eef4fb;
                font-family: "Avenir Next", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 16px;
                line-height: 24px;
                margin: 0;
                color: #4b5f77;
            }

            pre {
                background: #f4f8fd;
                padding: 4px;
                border: 1px solid #d6e0ed;
                border-radius: 6px;
            }

            table {
                width: 100%;
                border: 1px solid #c1d0e2;
                border-collapse: collapse;
            }
            table th {
                border: 1px solid #d3deeb;
                background-color: #edf3fb;
                color: #445a74;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 0.04em;
                padding: 10px 12px;
                text-align: left;
                text-transform: uppercase;
            }
            table td {
                border: 1px solid #d3deeb;
                color: #0f1b2d;
                padding: 10px 12px;
            }

            .wrap {
                background-color: #fff;
                padding: 32px;
                max-width: 620px;
                margin: 0 auto;
                border-radius: 18px;
                border: 1px solid #d6e0ed;
            }

            .button {
                background: #48e59b;
                border-radius: 10px;
                text-decoration: none !important;
                color: #032017 !important;
                font-weight: 700;
                padding: 11px 22px;
                display: inline-block;
            }
            .button:hover {
                background: #35cf89;
            }

            .footer {
                text-align: center;
                font-size: 12px;
                color: #6c7e94;
            }
                .footer a {
                    color: #18865f;
                    margin-right: 5px;
                }

            .gutter {
                padding: 24px;
            }

            img {
                max-width: 100%;
                height: auto;
            }

            a {
                color: #18865f;
                text-decoration-color: #9adfc0;
                text-underline-offset: 3px;
            }
                a:hover {
                    color: #136a4b;
                }
            @media screen and (max-width: 600px) {
                .wrap {
                    max-width: auto;
                }
                .gutter {
                    padding: 10px;
                }
            }
        </style>
    </head>
<body style="background-color: #eef4fb;font-family: &quot;Avenir Next&quot;, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, sans-serif;font-size: 16px;line-height: 24px;margin: 0;color: #4b5f77;">
    <div class="gutter" style="padding: 24px;">&nbsp;</div>
    <div class="wrap" style="background-color: #fff;padding: 32px;max-width: 620px;margin: 0 auto;border-radius: 18px;border: 1px solid #d6e0ed;">
        {{ template "content" . }}
    </div>
    
    <div class="footer" style="text-align: center;font-size: 12px;color: #6c7e94;">
        <p>{{ L.T "public.poweredBy" }} <a href="https://namefi.io" target="_blank" rel="noreferrer" style="color: #18865f;">Namefi</a></p>
    </div>
</body>
</html>
