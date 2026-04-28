/**
 * https://docs.cloud.google.com/load-balancing/docs/https/custom-headers#variables
 * [variables](./google-lb-headers-doc.md)
 *
 */
const GOOGLE_LB_HEADERS = [
  {
    headerName: 'X-Client-Geo-Location-Region',
    equivalentGcloudTemplate: '{client_region}',
  },
  {
    headerName: 'X-Client-Geo-Location-City',
    equivalentGcloudTemplate: '{client_city}',
  },
  {
    headerName: 'X-Client-Geo-Location-Region-Subdivision',
    equivalentGcloudTemplate: '{client_region_subdivision}',
  },
  {
    headerName: 'X-Client-Geo-Location-City-Coordinates',
    equivalentGcloudTemplate: '{client_city_lat_long}',
  },
  {
    headerName: 'X-Client-Ip-Address',
    equivalentGcloudTemplate: '{client_ip_address}',
  },
  {
    headerName: 'X-Client-Proto',
    equivalentGcloudTemplate: '{client_protocol}',
  },
  {
    headerName: 'X-Client-Device-Type',
    equivalentGcloudTemplate: '{device_request_type}',
  },
  {
    headerName: 'X-Client-User-Agent-Family',
    equivalentGcloudTemplate: '{user_agent_family}',
  },
  { headerName: 'X-GCLOUD-LB', equivalentGcloudTemplate: 'true' },
];
