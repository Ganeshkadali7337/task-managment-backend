# Functionality
  i have created this project by using node.js express mongodb, i have interacted with mongodb for creating database bor users and tasks
  
  Initially user have to create an account as admin to create the tasks and assign the tasks to users, after creating the admin account he can login through his admin login credintials, after successfull
  login he can add the users for assigning the tasks for them, and he can add the task and assign to the user, and he can delete the task

  after admin has assigned a task to the user, user can login through his user login credentials and he can see the list of tasks which he have assigned to do, and he can update the status of the task
  (pending, inprogress, completed), only admins can create the user accounts, users have no access to create the account by their own.

# APIs and Responses:

### POST /admin/register:
  by using this api users can create an admin account for adding the tasks and assigning the tasks for users
  in this route user have to send some credentials (username, password, confirmpassword) in the body to create an admin account,
  username should be unique.
  if password and confirm password is didn't matched it throws an error as "password did not match".
  if the correct credentials are send to the body the new admin account has been created and we get the response as "Admin registered successfully",
  or if any of the credentials is wrong it throws an error
### POST /adminLogin:
  after creating account using register api admin can login to his admin account by giving his login credentials
  if the login is successfull a json web token is generated and sends that {token} as response,
  we use this token verification for every admin actions
  if login was a failure it throws an error
### POST /user/register:
  only admins can create user accounts, users have no permission to create new account by their own.
  admin have to create an user account by giving some credentials in body, and have to send the jwt token in headers for admin verification.
  if the admin verification was successfull a user account is created and sends response as "User registered successfully".
  if password and confirm password is didn't matched it throws an error as "password did not match".
  if there is a user already in the database the same username it throws an error as "user already exists"
### POST /userLogin:
  after admin created the user account, user can login through the credentials, 
  if the login is successfull a json web token is generated and sends that {token} as response,
  we use this token verification for every user actions
  if login was a failure it throws an error
### POST /tasks:
  only admins can add the tasks to database
  for adding the task admin have to ligin through his credentials, after successfull login a jwt token is sends as a response
  only if the token validation is successfull then takes the details regarding task and sends it in body, and creates a task and assigns to a user,
  and added in to the database
  if the task is added successfully it sends an response as "task added successfully"
  if threre is any orror it throws that error
### PUT /tasks/:id:
  user can update the task by accessing the task by using the task id,
  if a user is successfully logged in a jwt token is generated and only if the jwt token is verified through middleware function then only he has access to 
  the tasks he was assigned to and then only he can update the task status,
  if the update was successfull it sends response as "task status updated"
  if the token is invalid it throws an error.
### DELETE /tasks/:id:
  only admins can delete the task he has created and added in the database,
  admin can delete the task by accessing the task by using the task id,
  if a admin is successfully logged in a jwt token is generated and only if the jwt token is verified through middleware function then only he has access to 
  the tasks he was added to the database and then only he can delete the task,
  if the deletion was successfull it sends response as "task deleted successfully"
  if the token is invalid it throws an error.
