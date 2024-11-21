import { client } from "../../utils/prismaClient";
import bcrypt from 'bcrypt'
const getUserProfile = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const populatedUser = await client.user.findUnique({
      where: {
        id: loggedInUserId,
      },
      select: {
        password: false,
      },
    });
    return res.status(201).json({
      user: populatedUser,
    });
  } catch (error) {
    return res.status(411).json({
      message: "Something went wrong while fetching the user profile",
    });
  }
};
const updateUserProfile = (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    // things we can update is
    //  email     String    @unique
    //   password  String
    //   username  String
    //   projects  Project[]
    const { projectId, password, email, username } = req.body;

    try {
      // Update the user details
      const updatedUser = await client.user.update({
        where: {
          email: email,
        },
        data: {
          email: email,
          username: username,
          password: await bcrypt.hash(password, 10), // Ensure the password is hashed
        },
      });
    
      // Find the project
      const project = await client.project.findUnique({
        where: {
          id: projectId,
        },
      });
    
      if (!project) {
        return res.status(404).json({
          message: "No such project found",
        });
      }
    
      // Update the project's members
      const updatedProject = await client.project.update({
        where: {
          id: projectId,
        },
        data: {
          members: {
            connect: { id: updatedUser.id }, // Connect the updated user to the project's members
          },
        },
      });
    
      return res.status(200).json({
        message: "Project and user updated successfully",
        project: updatedProject,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating project:", error);
      return res.status(500).json({
        message: "An error occurred while updating the project",
        error: error.message,
      });
    }
    
  } catch (error) {
    return res.status(411).json({
      message: "Something went wrong while Updating the user profile",
    });
  }
};
