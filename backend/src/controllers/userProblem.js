const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")
const {handleError} = require("../utils/httpError");

const createProblem = async (req,res)=>{
   
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;

    try{
       
      for(const {language,completeCode} of referenceSolution){
         
        const languageId = getLanguageById(language);
          
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));

        const submitResult = await submitBatch(submissions);

        const resultToken = submitResult.map((value)=> value.token);

       const testResult = await submitToken(resultToken);

       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).json({ message: "Reference solution failed the test cases" });
        }
       }

      }

    const userProblem =  await Problem.create({
        ...req.body,
        problemCreator: req.result._id
      });

      res.status(201).json({ message: "Problem Saved Successfully" });
    }
    catch(err){
        handleError(res, err);
    }
}

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).json({ message: "Missing ID Field" });
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).json({ message: "Problem not found" });
    }
      
    for(const {language,completeCode} of referenceSolution){
         
      const languageId = getLanguageById(language);
        
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));

      const submitResult = await submitBatch(submissions);

      const resultToken = submitResult.map((value)=> value.token);

     const testResult = await submitToken(resultToken);

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).json({ message: "Reference solution failed the test cases" });
      }
     }

    }

  const newProblem = await Problem.findByIdAndUpdate(id , {...req.body}, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      handleError(res, err);
  }
}

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).json({ message: "ID is Missing" });

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).json({ message: "Problem is Missing" });

   res.status(200).json({ message: "Successfully Deleted" });
  }
  catch(err){
     
    handleError(res, err);
  }
}

const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).json({ message: "ID is Missing" });

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
   if(!getProblem)
    return res.status(404).json({ message: "Problem is Missing" });

   const videos = await SolutionVideo.findOne({problemId:id});

   if(videos){   
    
   const responseData = {
    ...getProblem.toObject(),
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).send(responseData);
   }
    
   res.status(200).send(getProblem);

  }
  catch(err){
    handleError(res, err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

   res.status(200).send(getProblem);
  }
  catch(err){
    handleError(res, err);
  }
}

const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      res.status(200).send(user.problemSolved);

    }
    catch(err){
      handleError(res, err);
    }
}

const submittedProblem = async(req,res)=>{

  try{
     
    const userId = req.result._id;
    const problemId = req.params.pid;

   const ans = await Submission.find({userId,problemId});
  
  res.status(200).send(ans);

  }
  catch(err){
     handleError(res, err);
  }
}

module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};
