const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require("../models/user");
const {getLanguageById,submitBatch,submitToken,summarizeResults} = require("../utils/problemUtility");
const {handleError} = require("../utils/httpError");

const submitCode = async (req,res)=>{
   
    try{
      
       const userId = req.result._id;
       const problemId = req.params.id;

       let {code,language} = req.body;

      if(!userId||!code||!problemId||!language)
        return res.status(400).json({ message: "Some field missing" });
      
      if(language==='cpp')
        language='c++'

       const problem =  await Problem.findById(problemId);
       if(!problem)
        return res.status(404).json({ message: "Problem not found" });
    
    const submittedResult = await Submission.create({
          userId,
          problemId,
          code,
          language,
          status:'pending',
          testCasesTotal:problem.hiddenTestCases.length
     })

    const languageId = getLanguageById(language);
   
    const submissions = problem.hiddenTestCases.map((testcase)=>({
        source_code:code,
        language_id: languageId,
        stdin: testcase.input,
        expected_output: testcase.output
    }));

    const submitResult = await submitBatch(submissions);
    
    const resultToken = submitResult.map((value)=> value.token);

    const testResult = await submitToken(resultToken);
    
    const {passed:testCasesPassed,runtime,memory,status,errorMessage} = summarizeResults(testResult);

    submittedResult.status   = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.errorMessage = errorMessage;
    submittedResult.runtime = runtime;
    submittedResult.memory = memory;

    await submittedResult.save();
    
    if(status==='accepted' && !req.result.problemSolved.includes(problemId)){
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }
    
    const accepted = (status == 'accepted')
    res.status(201).json({
      accepted,
      totalTestCases: submittedResult.testCasesTotal,
      passedTestCases: testCasesPassed,
      runtime,
      memory
    });
       
    }
    catch(err){
      handleError(res, err);
    }
}

const runCode = async(req,res)=>{
    
     try{
      const userId = req.result._id;
      const problemId = req.params.id;

      let {code,language} = req.body;

     if(!userId||!code||!problemId||!language)
       return res.status(400).json({ message: "Some field missing" });

      const problem =  await Problem.findById(problemId);
      if(!problem)
        return res.status(404).json({ message: "Problem not found" });
      if(language==='cpp')
        language='c++'

   const languageId = getLanguageById(language);

   const submissions = problem.visibleTestCases.map((testcase)=>({
       source_code:code,
       language_id: languageId,
       stdin: testcase.input,
       expected_output: testcase.output
   }));

   const submitResult = await submitBatch(submissions);
   
   const resultToken = submitResult.map((value)=> value.token);

   const testResult = await submitToken(resultToken);

    const {runtime,memory,status} = summarizeResults(testResult);

   res.status(201).json({
    success:status==='accepted',
    testCases: testResult,
    runtime,
    memory
   });
      
   }
   catch(err){
     handleError(res, err);
   }
}

module.exports = {submitCode,runCode};
