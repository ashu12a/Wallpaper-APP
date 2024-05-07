import axios from "axios";

const API_KEY = '43746084-a0004ac8aa1b288fe6b0c96d8';

const API_URL = `https://pixabay.com/api/?key=${API_KEY}`;

const formatUrl = (params)=>{ // { q, page, category, order }
    let url = API_URL + "&per_page=25&safesearch=true&editors_choice=true";
    if(!params) return url;
    let paramKeys = Object.keys(params);
    paramKeys.map(key=>{
        let value = key == 'q' ? encodeURIComponent(params[key]) : params[key];
        url += `&${key}=${value}`;
    });

    return url;
}

export const apiCall = async (params) =>{
    try{
        const response = await axios.get(formatUrl(params));
        const {data} = response;
        return {success:true, data};
    }catch(error){
        console.log(`Got Error ${error?.message}`);
        return {success:false,message:error.message};
    }
}