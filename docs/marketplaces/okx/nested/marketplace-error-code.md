# Error codes

| Code  | HTTP status | Message                                                                                  |
| ----- | ----------- | ---------------------------------------------------------------------------------------- |
| 0     | 200         | Succeeded                                                                                |
| 50011 | 429         | Rate limit reached; please refer to API documentation and throttle requests accordingly  |
| 50014 | 400         | Parameter param0 cannot be empty                                                         |
| 50026 | 500         | System error; try again later                                                            |
| 50103 | 401         | Request header "OK-ACCESS-KEY" cannot be empty                                           |
| 50104 | 401         | Request header "OK-ACCESS-PASSPHRASE" cannot be empty.                                   |
| 50105 | 401         | Request header "OK-ACCESS-PASSPHRASE" incorrect                                          |
| 50106 | 401         | Request header "OK-ACCESS-SIGN" cannot be empty                                          |
| 50107 | 401         | Request header "OK-ACCESS-TIMESTAMP" cannot be empty                                     |
| 50111 | 401         | Invalid OK-ACCESS-KEY                                                                    |
| 50112 | 401         | Invalid OK-ACCESS-TIMESTAMP                                                              |
| 50113 | 401         | Invalid signature                                                                        |
| 83000 | 200         | Data not found                                                                           |
| 83001 | 200         | Wrong parameters                                                                         |
| 83002 | 200         | Chain not supported                                                                      |
| 83003 | 200         | Time range contains a conflict between optional exclusive peers [createTime, updateTime] |
