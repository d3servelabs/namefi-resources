| Variable | Description |
|origin_request_header |	Reflects the value of the Origin header in the request for Cross-Origin Resource Sharing (CORS) use cases.|
|client_region |	The country (or region) associated with the client's IP address. This is a Unicode CLDR region code, such as US or FR. (For most countries, these codes correspond directly to ISO-3166-2 codes.)|
| client_region_subdivision |	Subdivision, for example, a province or state, of the country associated with the client's IP address. This is a Unicode CLDR subdivision ID, such as USCA or CAON. (These Unicode codes are derived from the subdivisions defined by the ISO-3166-2 standard.) |
| client_city |	Name of the city from which the request originated, for example, Mountain View for Mountain View, California. There is no canonical list of valid values for this variable. The city names can contain US-ASCII letters, numbers, spaces, and the following characters: !#$%&'*+-.^_`|~. |
| client_city_lat_long |	Latitude and Longitude of the city from which the request originated, for example, 37.386051,-122.083851 for a request from Mountain View. |
| client_ip_address |	The client's IP address. This is usually the same as the client IP address that is the next-to-last address in the X-Forwarded-For header, unless the client is using a proxy or the X-Forwarded-For header has been tampered with. |
| client_port |	The client's source port. |
| client_encrypted |	true if the connection between the client and the load balancer is encrypted (using HTTPS, HTTP/2 or HTTP/3); otherwise, false. |
| client_protocol |	The HTTP protocol used for communication between the client and the load balancer. One of HTTP/1.0, HTTP/1.1, HTTP/2, or HTTP/3. |
| device_request_type |	The client's device, derived from User-Agent header values.The following are possible values: DESKTOP, GAME_CONSOLE, GAME_CONSOLE, MOBILE, SET_TOP_BOX, SMART_SPEAKER, SMART_TV, TABLET, UNDETERMINED, WEARABLE. |
|user_agent_family	| The client's browser type, derived from User-Agent header values.The following are possible values: APPLE, APPLEWEBKIT, BLACKBERRY, DOCOMO, GECKO, GOOGLE, KHTML, KOREAN, MICROSOFT, MSIE, NETFRONT, NOKIA, OBIGO, OPERA, OPENWAVE, OTHER, POLARIS, SEMC, SMIT, TELECA, USER_DEFINED.|
