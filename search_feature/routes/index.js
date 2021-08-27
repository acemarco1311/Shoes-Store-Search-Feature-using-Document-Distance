var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

const sql = require('mssql/msnodesqlv8');
const pool = new sql.ConnectionPool({
    database: 'ShoesStore',
    server: 'LAPTOP-O70TM76D',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true,
    }
});

// router.post('/search', function(req,res,next){
//   pool.connect().then(() => {
//     var resultPriceSize = [];
//     pool.request().query('select * from Shoes;', (err, result) => {
//       if(err){
//         res.sendStatus(500);
//         return;
//       }
//       res.send(result);

//     });
//   });
// });

router.post('/search', function(req, res, next){
    var resultPriceSize = [];
    pool.connect().then(() => {
        var ps = new sql.PreparedStatement(pool);
        ps.input('max_price', sql.Decimal(6,2));
        ps.input('min_price', sql.Decimal(6,2));
        ps.input('max_size',  sql.Decimal(3,1));
        ps.input('min_size',  sql.Decimal(3,1));
        //get the shoes matching Size and Price
        ps.prepare(`select Shoes.itemID, Shoes.itemName, Shoes.brand, Shoes.price, ModelStock.size
    from Shoes join ModelStock
    on Shoes.itemID = ModelStock.itemID
    where Shoes.price >= @min_price and Shoes.price <= @max_price
    and ModelStock.stockNumber > 0
    and ModelStock.size >= @min_size and ModelStock.size <= @max_size;`, err => {
        if(err){
            res.sendStatus(100);
            return;
        }
        ps.execute({min_price: req.body.minPrice, max_price: req.body.maxPrice, min_size: req.body.minSize, max_size: req.body.maxSize}, (err, result) => {
            if(err){
                res.sendStatus(200);
                return;
            }
            for(let i=0; i<result.recordset.length; i++){
                resultPriceSize.push(result.recordset[i]);
            }
            //filter to get the shoes match the Brand
            var resultPriceSizeBrand = [];
            //            if(req.body.brands[0] === ""){
            //               for(let index=0; index<resultPriceSize.length; index++){
            //                  resultPriceSizeBrand.push(resultPriceSize[index]);
            //             }
            //        }
            //       else{
            //          for(let index = 0; index < resultPriceSize.length; index++){
            //             for(let i = 0; i < req.body.brands.length; i++){
            //                if(resultPriceSize[index].brand.toUpperCase() === req.body.brands[i].toUpperCase()){
            //                   resultPriceSizeBrand.push(resultPriceSize[index]);
            //              }
            //         }
            //    }
            //}

            //implement document_distance
            for(let index = 0; index < resultPriceSize.length; index++){
                let all_words = [];
                let given_search_words = [];
                let current_model_words = [];
                //get all words from 2 strings, only get unique word a-z A-Z 0-9
                for(let i = 0; i < req.body.brands.length; i++){
                    given_search_words.push(req.body.brands[i].toUpperCase());
                }
                current_model_words= resultPriceSize[index].itemName.split(' ');
                for(let i = 0; i < current_model_words.length; i++){
                    current_model_words[i] = current_model_words[i].toUpperCase();
                }
                for(let i = 0; i<given_search_words.length; i++){
                    if(all_words.includes(given_search_words[i]) == false){
                        all_words.push(given_search_words[i].toUpperCase());
                    }
                }
                for(let i = 0; i<current_model_words.length; i++){
                    if(all_words.includes(current_model_words[i]) == false){
                        all_words.push(current_model_words[i].toUpperCase());
                    }
                }
                //array that contain all word and frequency of given_search and current_model for each word
                let full_all_words = [];
                for(let i = 0; i < all_words.length; i++){
                    full_all_words[i] = {
                        word: all_words[i].toUpperCase(),
                        given_search_frequency: 0,
                        current_model_frequency: 0,
                    }
                }
                //update frequency
                for(let i = 0; i < full_all_words.length; i++){
                    for(let n = 0; n < given_search_words.length; n++){
                        if(given_search_words[n] === full_all_words[i].word){
                            full_all_words[i].given_search_frequency += 1;
                        }
                    }
                    for (let m = 0; m < current_model_words.length; m++){
                        if(current_model_words[m] === full_all_words[i].word){
                            full_all_words[i].current_model_frequency += 1;
                        }
                    }
                }
                //get 2 vectors of frequency
                let given_search_vector = [];
                let current_model_vector = [];
                for(let i = 0; i<full_all_words.length; i++){
                    given_search_vector.push(full_all_words[i].given_search_frequency);
                    current_model_vector.push(full_all_words[i].current_model_frequency);
                }
                //compute dot product of 2 vector
                let dot_product = 0;
                let given_search_vector_length = 0;
                let current_model_vector_length = 0;
                for(let i = 0; i<given_search_vector.length; i++){
                    dot_product = dot_product + (given_search_vector[i] * current_model_vector[i]);
                    given_search_vector_length += Math.pow(given_search_vector[i], 2);
                    current_model_vector_length += Math.pow(current_model_vector[i], 2);
                }
                //get the length of 2 vector
                given_search_vector_length = Math.sqrt(given_search_vector_length);
                current_model_vector_length = Math.sqrt(current_model_vector_length);
                //apply the document distance to get the similarity of 2 string, result = [0; pi/2]
                let similarity = Math.acos(dot_product / (given_search_vector_length * current_model_vector_length));
                resultPriceSize[index].distance = similarity;
                //get the similarity from 0 (identical) to 1.3
                var given_search_string = "";
                for(let i = 0; i < given_search_words.length; i++){
                    given_search_string = given_search_string + " " + given_search_words[i];
                }
                given_search_string = given_search_string.trim();
                if((resultPriceSize[index].distance >= 0 && resultPriceSize[index].distance <= 1.3)){
                    resultPriceSizeBrand.push(resultPriceSize[index]);
                }
                else if(resultPriceSize[index].itemName.toUpperCase().includes(given_search_string.toUpperCase()) == true){
                    resultPriceSizeBrand.push(resultPriceSize[index]);
                }
                
                // resultPriceSizeBrand.push(resultPriceSize[index]);
            }

            //get styles of each model
            for(let index = 0 ; index < resultPriceSizeBrand.length; index++){
                resultPriceSizeBrand[index].styles = [];
            }
            // res.send(resultPriceSizeBrand);
            pool.request().query(`select ShoesStyle.itemID, Styles.styleName
                from ShoesStyle JOIN Styles ON ShoesStyle.styleID = Styles.styleID;`, (err, result) => {
                    if(err){
                        res.sendStatus(500);
                        return;
                    }
                    for(let index = 0; index < resultPriceSizeBrand.length; index++){
                        for(let i = 0; i < result.recordset.length; i++){
                            if(result.recordset[i].itemID == resultPriceSizeBrand[index].itemID){
                                resultPriceSizeBrand[index].styles.push(result.recordset[i].styleName.toUpperCase());
                            }
                        }
                    }
                    for(let index=0; index < req.body.styles.length; index++){
                        req.body.styles[index] = req.body.styles[index].toUpperCase();
                    }
                    var completeResult = [];
                    if(req.body.styles[0] === ""){
                        completeResult = resultPriceSizeBrand;
                    }
                    else{
                        for(let index = 0; index < resultPriceSizeBrand.length; index++){
                            for(let i = 0; i < req.body.styles.length; i++){
                                if(resultPriceSizeBrand[index].styles.includes(req.body.styles[i])){
                                    completeResult.push(resultPriceSizeBrand[index]);
                                }
                            }
                        }
                    }
                    //get color of models
                    for(let index = 0; index < completeResult.length; index++){
                        completeResult[index].colors = [];
                    }
                    pool.request().query(`select ShoesColor.itemID, Colors.colorName
                  from ShoesColor JOIN Colors
                  ON ShoesColor.colorID = Colors.colorID`, (err, result) => {
                      if(err){
                          res.sendStatus(500);
                          return;
                      }
                      for(let index = 0; index < completeResult.length; index++){
                          for(let i = 0; i<result.recordset.length; i++){
                              if(result.recordset[i].itemID  == completeResult[index].itemID){
                                  completeResult[index].colors.push(result.recordset[i].colorName);
                              }
                          }
                      }
                      //get the stock of each size of each model
                      pool.request().query(`select recordID, itemID, size,
                    stockNumber from ModelStock;`, (err, result) => {
                        if(err){
                            res.sendStatus(500);
                            return;
                        }
                        for(let index = 0 ; index < completeResult.length; index++){
                            completeResult[index].stockNumber = 0;
                            for(let i = 0 ; i < result.recordset.length; i++){
                                if(result.recordset[i].itemID == completeResult[index].itemID &&
                                    result.recordset[i].size == completeResult[index].size){
                                    completeResult[index].stockNumber = result.recordset[i].stockNumber;
                                }
                            }
                        }
                        //sorting result based on similarity (distance) using insertion sort
                        for(let index = 1; index < completeResult.length; index++){
                            let key = completeResult[index];
                            let i = index - 1;
                            while(i >= 0 && completeResult[i].distance > key.distance){
                                completeResult[i+1] = completeResult[i];
                                i = i -1;
                            }
                            completeResult[i+1] = key;
                        }
                        res.send(completeResult);
                    });

                  });
                });


            ps.unprepare(err => {
                if(err){
                    res.sendStatus(300);
                }
            });
        });
    });

    });
});

module.exports = router;
