I haven't tested this one yet, so no promises on how well it will work. But this should provide the template for a basic schema for MySQL. The docker-compose file, when run, will spin up a docker that will contain a MySQL instance. It will also pass in the schema.sql file for it to run on startup which will create the default tables in the database. Will work on getting a script to run all of these at a later point 

To spin up the docker for the first time, make sure you have docker and docker-compose installed locally. Then run the following command in the same directory as the docker-compose.yml file
- docker-compose up -d 

You can view all running dockers by running *docker ps* which whould show *mysql_container* running on port 3306 

You can then access the MySQL database directly by running *mysql -u user -p -h 127.0.0.1 -P 3306* and enter the password *password* when prompted
- The default schema contained in schema.sql should be already be implemented as a result of spinning up the docker
