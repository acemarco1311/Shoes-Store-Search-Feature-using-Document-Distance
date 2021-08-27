

var search = new Vue({
    el: "#container",
    data:{
        brands: [],
        styles: [],
        minSize: document.getElementById('min-size').value,
        maxSize: document.getElementById('max-size').value,
        minPrice: document.getElementById('min'),
        maxPrice: document.getElementById('max'),
        result: [],
    },
    methods: {
        search : function(){
            //search.brands = document.getElementById('brand').value.split(',');
            given_search  = document.getElementById('brand').value;
            search.styles = document.getElementById('style').value.split(',');
            search.minSize = document.getElementById('min-size').value;
            search.maxSize = document.getElementById('max-size').value;
            search.minPrice = document.getElementById('min').value;
            search.maxPrice = document.getElementById('max').value;
            search.result = []; // clear result after each search

            var given_words = [];
            var regX = new RegExp("([0-9A-Za-z])");
            for(let index = 0; index < given_search.length; index++){
                if(given_search.charAt(index) === " "){
                    continue;
                }
                else if(regX.test(given_search.charAt(index)) == false){
                    given_search = given_search.substring(0, index) + ' ' + given_search.substring(index+1, given_search.length);
                }
            }
            search.brands = given_search.split(" ");
            for(let index = 0; index < search.brands.length; index++){
                search.brands[index] = search.brands[index].trim();
            }
            for(let index = 0; index < search.styles.length; index++){
                search.styles[index] = search.styles[index].trim();
            }
            let criteria = {brands: search.brands, styles: search.styles, minSize: search.minSize, maxSize: search.maxSize, minPrice: search.minPrice, maxPrice: search.maxPrice};
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function(req, res, next){
             if(this.readyState === 4 && this.status === 200){
                //uncommented alert to see raw output of search/filter
                // alert(JSON.stringify(this.response));
                // var result = JSON.parse(this.response);
                var result = JSON.parse(this.response);
                alert(JSON.stringify(result));
                for(let index = 0 ; index < result.length; index++){
                    result[index].totalSizeStock = [];
                }

                //filter the result to group same model with different sizes in only 1 object
                for(let index = 0 ; index < result.length; index++){
                    for(let i = 0; i < result.length; i++){
                        if(result[index].itemID == result[i].itemID){
                            let sizeStock = {size: result[i].size, stockNumber: result[i].stockNumber};
                            result[index].totalSizeStock.push(sizeStock);
                        }
                    }
                }

                var uniqueID = [];
                for(let index = 0; index < result.length; index++){
                    if(!(uniqueID.includes(result[index].itemID))){
                        uniqueID.push(result[index].itemID);
                    }
                }
                for(let index = 0; index < uniqueID.length; index++){
                    for(let i=0; i<result.length; i++){
                        if(uniqueID[index] == result[i].itemID){
                            search.result.push(result[i]);
                            break;
                        }
                    }
                }
                // alert(JSON.stringify(search.result));
                document.getElementById('result-heading').style.display = 'block';
             }
            };
            xhttp.open('POST', '/search', true);
            xhttp.setRequestHeader('Content-type', 'application/json');
            xhttp.send(JSON.stringify(criteria));
        },
    }
});
