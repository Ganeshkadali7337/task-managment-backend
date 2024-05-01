const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Users = require("./usersModel");
const Task = require("./taskModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cors = require("cors");

app.use(cors());

app.use(express.json());

app.listen(3000, () => {
  console.log(`Server running on http://localhost:3000`);
});

mongoose
  .connect("mongodb+srv://ganesh:ganesh@cluster7337.7exrzd7.mongodb.net/")
  .then(() => console.log("db connected..."));

const isAuthenticated = (req, res, next) => {
  let jwtToken;
  const authHeader = req.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    res.status(401);
    res.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "ganesh", async (error, payload) => {
      if (error) {
        res.status(401);
        res.send("Invalid JWT Token");
      } else {
        req.userId = payload.userId;
        req.role = payload.role;
        next();
      }
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.role === "ADMIN") {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};

app.post("/admin/register", async (req, res) => {
  try {
    const { userName, password, confirmPassword } = req.body;
    let existed = await Users.findOne({ userName });
    if (existed) {
      return res.status(400).send("Admin already existed");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("password did not match");
    }
    let hashedPassword = await bcrypt.hash(password, 10);
    let newAdmin = new Users({
      userName,
      password: hashedPassword,
      role: "ADMIN",
    });
    await newAdmin.save();
    res.status(200).send("Admin registered successfully");
  } catch (err) {
    console.log(err.message);
    res.send(err.message);
  }
});

app.post("/adminLogin", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const existed = await Users.findOne({ userName });
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      if (existed.role !== "ADMIN") {
        res.status(401).send("Unauthorized");
      }
      let passwordMatch = await bcrypt.compare(password, existed.password);
      if (!passwordMatch) {
        return res.status(400).send("invalid password");
      } else {
        let payload = {
          userId: existed._id,
          role: existed.role,
        };
        let token = jwt.sign(payload, "ganesh");
        res.send({ token });
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/user/register", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userName, password, confirmPassword } = req.body;
    let existed = await Users.findOne({ userName });
    if (existed) {
      return res.status(400).send("User already existed");
    }
    if (password !== confirmPassword) {
      return res.status(400).send("password did not match");
    }
    let hashedPassword = await bcrypt.hash(password, 10);
    let newUser = new Users({
      userName,
      password: hashedPassword,
      role: "USER",
      createdBy: req.userId,
    });
    await newUser.save();
    res.status(200).send("User registered successfully");
  } catch (err) {
    console.log(err.message);
    res.send(err.message);
  }
});

app.post("/userLogin", async (req, res) => {
  try {
    const { userName, password } = req.body;
    const existed = await Users.findOne({ userName });
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      let passwordMatch = await bcrypt.compare(password, existed.password);
      if (!passwordMatch) {
        return res.status(400).send("invalid password");
      } else {
        let payload = {
          userId: existed._id,
          role: existed.role,
        };
        let token = jwt.sign(payload, "ganesh");
        res.send({ token });
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.post("/tasks", isAuthenticated, isAdmin, async (req, res) => {
  let { userId } = req;
  const { title, description, assigneeId } = req.body;
  const existed = await Users.findOne({ _id: userId });
  if (assigneeId.length !== 24) {
    return res.status(400).send("invalid assignee id");
  }
  const assignee = await Users.findOne({ _id: assigneeId });
  try {
    if (!existed) {
      return res.status(400).send("Admin not exist");
    } else {
      if (!assignee) {
        return res.status(400).send("user not exist");
      } else {
        const newTask = new Task({
          title,
          description,
          assigneeId,
          assigneeName: assignee.userName,
          assignedBy: existed.userName,
          createdBy: existed._id,
          status: "Pending",
        });
        await newTask.save();
        res.send("Task added successfully");
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.put("/tasks/:id", isAuthenticated, async (req, res) => {
  let { userId } = req;
  const { status } = req.body;
  const existed = await Users.findOne({ _id: userId });
  const task = await Task.findOne({ _id: req.params.id });
  const validStatus = ["Pending", "InProgress", "Completed"];
  if (!validStatus.includes(status)) {
    return res.status(400).send("invalid status");
  }
  if (req.role !== "USER") {
    return res.status(401).send("only users can update the status");
  }

  try {
    if (!existed) {
      console.log(userId);
      return res.status(400).send("user not exist");
    } else {
      if (task.assigneeId !== userId) {
        return res.status(401).send("user not assigned to the task");
      } else {
        console.log(req.params.id);
        await Task.findByIdAndUpdate(req.params.id, {
          status: status,
        });
        res.status(200).send("task status updated");
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.delete("/tasks/:id", isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(id);
  let { userId } = req;
  const existed = await Users.findOne({ _id: userId });
  const task = await Task.findOne({ _id: id });
  if (task.createdBy !== userId) {
    return res.status(400).send("task is not created by admin");
  }
  if (id.length !== 24) {
    return res.status(400).send("invalid task id");
  }
  const taskExist = await Task.findOne({ _id: id });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      if (!taskExist) {
        return res.status(400).send("task not exist");
      }
      await Task.findByIdAndDelete(id);
      res.send(`task ${id} is deleted`);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/tasks", isAuthenticated, async (req, res) => {
  let { userId } = req;
  const existed = await Users.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("user not exist");
    } else {
      if (req.role === "ADMIN") {
        let allTasks = await Task.find();
        let filteredTasks = allTasks.filter(
          (each) => each.createdBy === userId
        );
        res.send({ tasks: filteredTasks, role: req.role });
      } else {
        let allTasks = await Task.find();
        let filteredTasks = allTasks.filter(
          (each) => each.assigneeId === userId
        );
        res.send({ tasks: filteredTasks, role: req.role });
      }
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});

app.get("/userProfiles", isAuthenticated, isAdmin, async (req, res) => {
  let { userId } = req;
  const existed = await Users.findOne({ _id: userId });
  try {
    if (!existed) {
      return res.status(400).send("Admin not exist");
    } else {
      const allUsers = await Users.find();
      const filteredUsers = allUsers.filter(
        (each) => each.createdBy === userId
      );
      res.send({ filteredUsers: filteredUsers, role: req.role });
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("server error");
  }
});
