import { client } from "../../utils/prismaClient"

const getAllUsers =async(req,res)=>{
    try {
      const {projectId}= req.body
    const users = await client.project.findUnique({
        where:{
            id:projectId
        },select:{
            members:true
        }
    })
    if(!users){
        return res.status(411).json({
            message:"Something went wrong or there is no member"
        })
    }
    return res.status(200).json({
        users
    })   
    } catch (error) {
        return res.status(411).json({
            message:"Something went wrong"
        })
    }
   
}
// will build later if get the idea
const dashboardStats=(req,res)=>{
    
}