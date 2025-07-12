// Responsible for fetching data
const EleventyFetch = require("@11ty/eleventy-fetch");

module.exports = async function() {
    let url = `https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLj1wQAAnjdb_nYahocNlupPvGnZKdjtsjwKQ7E0lq_lQD-bSoF-I1gSKLIAT1pLzWD_j_DFkhEoqUjN8S9ciNwUlvHURGawutobGjUShTfw9dVBu89XBZw47nDtOgLGZ_juuAYiJepRwHFUMsT1LfE6c_fBGIQzIWjiU-Bsg3AB_gsBzL3cAvC8EQiSqd6I6sJ9PFjWhLgUAmb7AbjufWK4VimBafMYsK4inxtcPZDCStpDhqrqx-t_xuV9OBIiq9Yv4xq-LTtaGYUEynwZzoB47XcMiw&lib=MwQtQSqUERJ6fBs3Y0sL1XO-zcovy37sP`;
  
    const response = await EleventyFetch(url, {
      duration: "1d",
      type: "json"
    });
  
    return response.data;
};