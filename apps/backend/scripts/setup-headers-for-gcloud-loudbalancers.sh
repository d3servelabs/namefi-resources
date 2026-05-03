gcloud compute backend-services update backend-astra-dev-backend-service \
    --global \
    --custom-request-header='X-Client-Geo-Location-Region:{client_region}' \
    --custom-request-header='X-Client-Geo-Location-City:{client_city}' \
    --custom-request-header='X-Client-Geo-Location-Region-Subdivision:{client_region_subdivision}' \
    --custom-request-header='X-Client-Geo-Location-City-Coordinates:{client_city_lat_long}' \
    --custom-request-header='X-Client-Ip-Address:{client_ip_address}' \
    --custom-request-header='X-Client-Proto:{client_protocol}' \
    --custom-request-header='X-Client-Device-Type:{device_request_type}' \
    --custom-request-header='X-Client-User-Agent-Family:{user_agent_family}' \
    --custom-request-header='X-GCLOUD-LB:true'

gcloud compute backend-services update backend-astra-io-backend-service \
    --global \
    --custom-request-header='X-Client-Geo-Location-Region:{client_region}' \
    --custom-request-header='X-Client-Geo-Location-City:{client_city}' \
    --custom-request-header='X-Client-Geo-Location-Region-Subdivision:{client_region_subdivision}' \
    --custom-request-header='X-Client-Geo-Location-City-Coordinates:{client_city_lat_long}' \
    --custom-request-header='X-Client-Ip-Address:{client_ip_address}' \
    --custom-request-header='X-Client-Proto:{client_protocol}' \
    --custom-request-header='X-Client-Device-Type:{device_request_type}' \
    --custom-request-header='X-Client-User-Agent-Family:{user_agent_family}' \
    --custom-request-header='X-GCLOUD-LB:true'
