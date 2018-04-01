var lastItemId = null; var limit = 3;

$(()=>{

    window.pageEvents={
        loadCarPage:(carId)=>{
            $.get(`https://bstavroulakis.com/pluralsight/courses/progressive-web-apps/service/car.php?carId=${carId}`,(data)=>{
                $('body').append(data);
            })
    }
    ,
        loadMore:()=>{
            fetchCars((cars)=>{
                $('#first-load').hide();
                var cardHTML="";
                console.log(cars.length);
                for(var i=0;i<cars.length;i++){
                    var temp=generateCar(cars[i]);
                    cardHTML=cardHTML+temp;
                }
                console.log(cardHTML);
                grid.append(cardHTML);
                $('.mdl-layout__content').css({'display':'inline-block'});

            });
        }
    }

    var grid=$('.mdl-grid');
    fetchCars((cars)=>{
        $('#first-load').hide();
        var cardHTML="";
        console.log(cars.length);
        for(var i=0;i<cars.length;i++){
            var temp=generateCar(cars[i]);
            cardHTML=cardHTML+temp;
        }
        console.log(cardHTML);
        grid.append(cardHTML);
        $('.mdl-layout__content').css({'display':'inline-block'});

    });
});

function generateCar(car) {
    var g=car.brand+" "+car.year+" "+car.price;
    var x=`<div class="mdl-card mdl-cell mdl-cell--4-col mdl-shadow--6dp" style="background-image: url('${car.image}')" onclick="pageEvents.loadCarPage('${car.details_id}')">
        <div class="mdl-card__title">
        <span class="mdl-card__title-text">${g} (${car.price})</span>
</div>
</div>`;
    return x;
}

function fetchCars(callback) {
    fetchPromise()
        .then((status)=>{
            $('#connection-status').text(status);
            loadMore(callback);
        })
}


function fetchPromise() {
    return new Promise((resolve,reject)=>{
        $.ajax({
            url:`http://bstavroulakis.com/pluralsight/courses/progressive-web-apps/service/latest-deals.php?carId=${getLastCarId()}`,
            success:(data)=>{
                console.log(data);
                addCars(data.cars).then(()=>{
                    resolve("The connection is OK, showing latest results");
                });

            },
            error:(err)=>{
                resolve("No connection, showing offline results");
            }
        });
        setTimeout(()=>{
            resolve("The connection is hanging, showing offline results");
        },3000);
    });
}


function loadMore(callback)  //to get cars from indexedDB after the new data is loaded into the database
{
    getCars().then((cars)=>{
        callback(cars);
    })
}


//clientStorage.js

var carsInstance=localforage.createInstance({
    name:"cars"
});

function addCars(newCars) //add cars to IndexedDB
{
    return new Promise((resolve,reject)=>{
        carsInstance.setItems(newCars)
            .then(()=>{
                resolve();
            })
    })
}

function getCars(){  //get cars stored in IndexedDB
    return new Promise(function(resolve, reject){
        carsInstance.keys().then(function(keys){

            var index = keys.indexOf(lastItemId);
            if(index == -1){ index = keys.length; }
            if(index ==  0){ resolve([]); return; }

            var keys = keys.splice(index - limit, limit);
            carsInstance.getItems(keys).then(function(results){
                var returnArr = Object.keys(results).map(function(k) { return results[k] }).reverse();
                lastItemId = returnArr[returnArr.length-1].id;
                resolve(returnArr);
            });
        })
    })
}

function getLastCarId(){ //to get the id of the last car loaded
    return lastItemId;
}