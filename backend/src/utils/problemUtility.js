const axios = require('axios');

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions/batch';
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30;

const STATUS_ACCEPTED = 3;
const STATUS_WRONG_ANSWER = 4;

const getLanguageById = (lang)=>{

    const language = {
        "c++":54,
        "java":62,
        "javascript":63
    }

return language[lang.toLowerCase()];
}

const submitBatch = async (submissions)=>{

const options = {
  method: 'POST',
  url: JUDGE0_URL,
  params: {
    base64_encoded: 'false'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
    submissions
  }
};

  const response = await axios.request(options);
  return response.data;
}

const waiting = (timer)=> new Promise((resolve)=> setTimeout(resolve, timer));

const submitToken = async(resultToken, { interval = POLL_INTERVAL_MS, maxAttempts = MAX_POLL_ATTEMPTS } = {})=>{

const options = {
  method: 'GET',
  url: JUDGE0_URL,
  params: {
    tokens: resultToken.join(","),
    base64_encoded: 'false',
    fields: '*'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_KEY,
    'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
  }
};

for(let attempt = 0; attempt < maxAttempts; attempt++){

  const response = await axios.request(options);
  const result = response.data;

  const IsResultObtained =  result.submissions.every((r)=>r.status_id>2);

  if(IsResultObtained)
    return result.submissions;

  await waiting(interval);
}

throw new Error("Timed out waiting for Judge0 results");
}

const summarizeResults = (testResult)=>{

  let passed = 0;
  let runtime = 0;
  let memory = 0;
  let status = 'accepted';
  let errorMessage = null;

  for(const test of testResult){
    if(test.status_id==STATUS_ACCEPTED){
      passed++;
      runtime = runtime+parseFloat(test.time)
      memory = Math.max(memory,test.memory);
    }
    else if(test.status_id==STATUS_WRONG_ANSWER){
      if(status==='accepted')
        status = 'wrong'
    }
    else{
      status = 'error'
      errorMessage = test.stderr || test.compile_output || test.status?.description || null
    }
  }

  return {passed,runtime,memory,status,errorMessage};
}

module.exports = {getLanguageById,submitBatch,submitToken,waiting,summarizeResults};
