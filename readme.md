# Calendar Appointment System API
This is a calendar appointment system API where users can see free slot and they can book for whatever time period they wish to.

### Technology used

Calendar Appointment System API uses a number of open source projects to work properly:
* [node.js](https://nodejs.org/en/) - JavaScript runtime for the server
* [Express](http://expressjs.com/) - fast node.js network app framework
* [swagger-ui](http://swagger.io/tools/swagger-ui/) - for API documentation
* [firebase](https://firebase.google.com/) - for cloud data storage
* [ESLint](https://eslint.org/) - find and fix problems in the code

### Setup
Before the API setup you must make sure that you have node v12.*.* installed in your local.

1. You need to create a firebase project and create a JSON private key file for that project. You can also follow the instructions from here https://firebase.google.com/docs/admin/setup. Then add that JSON file inside the `/cert` directory with name `service_key.json`.

2. Install the dependencies and devDependencies and start the server.

```sh
$ cd <project>
$ npm install
$ npm start
```

You will see that the console will print the swagger doc URL and the sever endpoint URL. You can use those URLs according to your need.

### Considerations
- `409` is the correct status code for duplicate resource instead of `422` (Unprocessable Entity) so `409` is used if event already exists for that requested time.
- since in create/POST API we follow the convention of `201`, so `201` is used in create event API instead of `200`.
- For POST `/event` the payload parameter `duration` is not in use at the moment since the `date_time` property itself handles the slot determination which will be occupied by the event. 
- An extra API, POST `/slots` is added that will create the time slots for the particular date, after that you can create events for that particular slot.
- An extra API, GET `/status` is added for the purpose of determining the server uptime while the API is hosted as a public.
- The date-time are managed in UTC level so the response or payload request should have date-time in UTC and not local time.
- Made sure of query parameter and payload data validations.