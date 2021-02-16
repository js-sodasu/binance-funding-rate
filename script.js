const apiFutureHost = `https://fapi.binance.com`;
let listFundingRate = {};
let isDraw = 0;
let isShowFavOnly = true;
const drawShowFavOnly = (flag) => {
    
    if(flag){
        
        let listSymbols = JSON.parse(localStorage.getItem("listSymbols"));
        let allListItems = document.querySelectorAll(".list__item");
        for(let cnt=0;cnt<allListItems.length;cnt+=1){
            let elListItem = allListItems[cnt];
            let tmpSymbol = elListItem.dataset.symbol;
            if(listSymbols.indexOf(tmpSymbol)==-1){
                elListItem.style.display = 'none';
            }
            
        }
    }else{
        console.log('hi');
        let allListItems = document.querySelectorAll(".list__item");
        for(let cnt=0;cnt<allListItems.length;cnt+=1){
            let elListItem = allListItems[cnt];
            elListItem.style.display = 'block';
            
        }
    }
}
const toggleShowFavOnly = () => {
    let elBtnToggleShowFavOnly = document.querySelector("#showFavOnly")
    if(isShowFavOnly){
        isShowFavOnly = false;
        elBtnToggleShowFavOnly.classList.remove("btn__fav-only__on");   
        drawShowFavOnly(false);
        
    }else{
        isShowFavOnly = true;
        elBtnToggleShowFavOnly.classList.add("btn__fav-only__on");
        drawShowFavOnly(true);
        
    }
    localStorage.setItem("showFavOnly",isShowFavOnly);
}
//init show fav only
document.querySelector("#showFavOnly").addEventListener("click",toggleShowFavOnly);

const convTime = (time)=>{
    if(time == 0){
        return '';
    }
    time = time/1000 - moment().unix();
    if(time / 3600 > 0){
        return `${(time/3600).toFixed(0)} hours left`;
    }
    if(time / 60 > 0){
        return `${(time/60).toFixed(0)} minutes left`;
    }
    return `${time} seconds left`;
}
const setDB = (e) => {
    

    let target = e.target;
    let isChecked = e.target.checked;
    let symbol = target.dataset.symbol;
    let listSymbols;
    listSymbols = JSON.parse(localStorage.getItem("listSymbols"))
    if(listSymbols == null || listSymbols == ''){
        listSymbols = [];
        localStorage.setItem("listSymbols", JSON.stringify(listSymbols));
    }
    
    if(isChecked){
        if(listSymbols.indexOf(symbol) == -1){
            listSymbols.push(symbol);
        }
        
    }else{
        let idxSymbol = listSymbols.indexOf(symbol);
        if(idxSymbol != -1){
            listSymbols.splice(idxSymbol,1);
        }
    }
    localStorage.setItem("listSymbols", JSON.stringify(listSymbols));
    
}

const drawFundingRate = () => {
    let html = ``;
    if(isDraw){
        for(const [key,value] of Object.entries(listFundingRate)){
            let fundingRate = (parseFloat(value['fundingRate'])*100).toFixed(4);
            if(key.indexOf("_")!=-1) continue;
            let tmpEl = document.querySelector(`#data_symbol_${key}`);
            tmpEl.innerHTML = `<div>${fundingRate}%</div>`;
        }
    }else{
        let listSymbols = JSON.parse(localStorage.getItem("listSymbols"))
        if(listSymbols==null){
            listSymbols = [];
        }
        for(const [key,value] of Object.entries(listFundingRate)){
            let fundingRate = (parseFloat(value['fundingRate'])*100).toFixed(4);
            if(key.indexOf("_")!=-1) continue;
            let isChecked = ``;
            if(listSymbols.indexOf(key) != -1){
                isChecked = `checked=checked`;
            }
            html += `
                <div class="list__item" id="symbol_${key}_wrap" data-symbol='${key}' >
                    <input type="checkbox" name="symbol_${key}" class="chk__symbol" id="symbol_${key}" value="1" data-symbol="${key}" ${isChecked} />
                    <label class='list__item-label' data-symbol='${key}' id="label_symbol_${key}" for="symbol_${key}">
                        <div class='list__item-symbol'>
                            ${key}
                        </div>
                        <div class='list__item-rate' id="data_symbol_${key}">
                            <div>${fundingRate}%</div>
                        </div>
                        
                    </label>
                </div>
                
            `;
            
        }
        document.querySelector("#fundingItems").innerHTML = html;
        let allSymbols = document.querySelectorAll(".chk__symbol");
        
        for(let cnt=0;cnt<allSymbols.length;cnt+=1){
            
            allSymbols[cnt].addEventListener("change",setDB);
        }
        isDraw = 1;
        isShowFavOnly = JSON.parse(localStorage.getItem("showFavOnly"));
        drawShowFavOnly(isShowFavOnly);

        let elBtnToggleShowFavOnly = document.querySelector("#showFavOnly")
        if(isShowFavOnly){
            elBtnToggleShowFavOnly.classList.add("btn__fav-only__on");
        }else{
            elBtnToggleShowFavOnly.classList.remove("btn__fav-only__on");           
        }
    }

    
}

const getFundingRate = async(symbol='',startTime='',endTime='',limit=1000) => {
   
    let uriGetFundingRate = `${apiFutureHost}/fapi/v1/premiumIndex`;

    let params = `symbol=${symbol}`;

    
    let responseFundingRate,dataFundingRate;

    try{
        responseFundingRate = await axios({
            method:"GET",
            url:uriGetFundingRate,
            data:params,
        })
    }catch(e){
        responseFundingRate = e;
    }
    

    if(responseFundingRate.status != 200){
        console.error(`something wrong :(`);

        return false;
    }

    dataFundingRate = responseFundingRate.data;
    
    for(let cnt=0;cnt<dataFundingRate.length;cnt+=1){
        
        let tmpFundingRate = dataFundingRate[cnt];
        
        
        listFundingRate[tmpFundingRate['symbol']]  = {
            fundingRate:tmpFundingRate['lastFundingRate'],
            fundingTime:tmpFundingRate['nextFundingTime'],
        } 
    
        
    }
    
    drawFundingRate();
    

}
const drawServerTime = async(unixServerTime) => {
    
    let serverDateTime = moment.unix(unixServerTime/1000).format("YYYY/MM/DD hh:mm:ss")
    serverDate = serverDateTime.split(" ")[0];
    serverTime = serverDateTime.split(" ")[1];
    document.querySelector("#clockTime").innerHTML = `
        <div class='clock__data-time'>
            <span>${serverTime}</span>
        </div>
        <div class='clock__data-date'>
            <span>${serverDate}</span>

        </div>
    `;
}
const getServerTime = async()=>{
    let uriGetServerTime = `${apiFutureHost}/fapi/v1/time`;
    let response,data,unixServerTime;
    
    try{
        response = await axios({
            method:"GET",
            url:uriGetServerTime,
            
        })
    }catch(e){
        response = e;
    }
    
    if(response.status != 200){
        console.error(`something wrong :(`);
        return false;
    }
    data = response.data;
    unixServerTime = data.serverTime;
    drawServerTime(unixServerTime);
    await getFundingRate();
    setTimeout(getServerTime,300);
}
getServerTime();
