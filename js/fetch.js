var lastItemId = null; var limit = 3;

$(()=>{

    swRegister();

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
                // console.log(cars.length);
                for(var i=0;i<cars.length;i++){
                    var temp=generateCar(cars[i]);
                    cardHTML=cardHTML+temp;
                }
                // console.log(cardHTML);
                grid.append(cardHTML);
                $('.mdl-layout__content').css({'display':'inline-block'});

            });
        }
    }

    var grid=$('.mdl-grid');
    fetchCars((cars)=>{
        $('#first-load').hide();
        var cardHTML="";
        // console.log(cars.length);
        for(var i=0;i<cars.length;i++){
            var temp=generateCar(cars[i]);
            cardHTML=cardHTML+temp;
        }
        // console.log(cardHTML);
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
                // console.log(data);
                addCars(data.cars).then(()=>{
                    data.cars.forEach(preCacheDetailsPage)
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

function preCacheDetailsPage(car) {
    //if service worker object exist, we'll cache our data
    if('serviceWorker' in navigator){
        var carDetailsUrl=`http://bstavroulakis.com/pluralsight/courses/progressive-web-apps/service/car.php?carId=`+car.value.details_id;
        window.caches.open('carDealsCachePagesV1')   //opening cache object collection names carDealsCachePagesV1 (created if doesn't exist)
            .then((cache)=>{
                //now we'll check if page is already cached:
                //cache is a key-value pair with key as url and the value of data the page cached.
                cache.match(carDetailsUrl).then((response)=>{
                    if(!response) //if response does exist do nothing else
                    {
                        cache.add(new Request(carDetailsUrl)); //else add to cache
                    }
                })
            })

    }

}

//swRegister.js////////////////////////

function swRegister() {
    if('serviceWorker' in navigator) //check if service workers are enabled and compatible with user's browser
    {
        navigator.serviceWorker.register('sw.js',{scope:''}) //setting scope of service worker. In this case, service worker is at root path so it has full control over the page
            .then((swRegistration)=>{
                // console.log(swRegistration);
                var serviceWorker;
                if(swRegistration.installing)
                {
                    console.log('Resolved at installing',swRegistration);
                    serviceWorker=swRegistration.installing;
                }
                else if(swRegistration.waiting)
                {
                    console.log('Resolved at installing/waiting',swRegistration);
                    serviceWorker=swRegistration.waiting;
                }
                else if (swRegistration.active)
                {
                    console.log('Resolved at activated',swRegistration);
                    serviceWorker=swRegistration.active;
                }
                if (serviceWorker)
                {
                    serviceWorker.addEventListener('statechange',(e)=>{
                        console.log(e.target.state);
                    })
                }

                swRegistration.addEventListener('updatefound',(e)=>{ //fired everytime updated service worker is found
                    swRegistration.installing.addEventListener('statechange',(e)=>{
                        console.log('new service state :'+ e.target.state);
                    })
                    console.log("new service worker found");
                });

                setInterval(()=>{ //check for update after every 5 seconds ch
                    swRegistration.update();
                },5000);

            })
            .catch((err)=>{
                console.log('Error occured:',err);
            });

            navigator.serviceWorker.addEventListener('controllerchange',(e)=>{
                console.log('controller changed'); //fired when service worker controlling the page changes through self.client.clain and self.skipwaiting in sw.js file
            })
    }
}