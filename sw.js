"use strict";

//news

var carDealsCacheName='carDealsCacheV1',carDealsCachePagesName='carDealsCachePagesV1',carDealsCacheImagesName = 'carDealsCacheImagesV1';


var carDealsCacheFiles = [
    'js/jquery.js',
    'js/fetch.js',
    'favicon.ico',
    './',
    'resources/es6-promise/es6-promise.js',
    'resources/es6-promise/es6-promise.map',
    'resources/localforage/localforage.min.js',
    'resources/localforage/localforage-getitems.js',
    'resources/localforage/localforage-setitems.js',
    'resources/material-design-light/material.min.js',
    'resources/material-design-light/material.min.js.map',
    'resources/material-design-light/material.red-indigo.min.css'
];

var latestPath = '/pluralsight/courses/progressive-web-apps/service/latest-deals.php';
var imagePath = '/pluralsight/courses/progressive-web-apps/service/car-image.php';
var carPath = '/pluralsight/courses/progressive-web-apps/service/car.php';

self.addEventListener('install',function(event){
    console.log('From SW: Install Event',event);
    self.skipWaiting(); //to skip waiting and gain immediate control if old service worker is already present. therefore, makes waiting service worker the active service worker
    event.waitUntil(
        caches.open(carDealsCacheName)
            .then(function (cache) {
                return cache.addAll([
                    'js/jquery.js',
                    'js/fetch.js',
                    '/',
                    'resources/localforage/localforage.min.js',
                    'resources/localforage/localforage-getitems.js',
                    'resources/localforage/localforage-setitems.js',
                    'resources/material-design-light/material.min.js',
                    'resources/material-design-light/material.min.js.map',
                    'resources/material-design-light/material.red-indigo.min.css'
                ]).then(()=>{
                    console.log("yeah cache made");
                })
                    .catch((err)=>{
                        console.log("Cache not made :",err);
                    });
            })
            .catch(function (err) {
                console.log("error :(",err);
            })
    )

});

self.addEventListener('activate',function (event) {
    console.log('From SW: Activate State:',event);
    self.clients.claim(); //used to make the service worker active and replacing service worker for active tabs without reloading them. therefore, takes effect immediately to all active clients.

    event.waitUntil(
        caches.keys()
            .then(function (cacheKeys) { //for updating cache
                var deletePromises=[];
                for(var i=0;i<cacheKeys.length;i++)
                {
                    if(cacheKeys[i]!==carDealsCacheName && cacheKeys[i]!==carDealsCachePagesName && cacheKeys[i] !==carDealsCachePagesName)
                    {
                        deletePromises.push(caches.delete(cacheKeys[i]));
                    }
                }
                return Promise.all(deletePromises);
            })
    )
});

self.addEventListener('fetch',function (event) {  //fetch means fetching from network or cache
   // console.log(event);
   //  event.respondWith(new Response('hello'));  //respond with "hello" message

    var requestUrl = new URL(event.request.url);
    var requestPath = requestUrl.pathname;
    var fileName = requestPath.substring(requestPath.lastIndexOf('/')+1);

    if(requestPath === latestPath || fileName === "sw.js"){
        //Network Only Strategy
        event.respondWith(fetch(event.request));
    }else if(requestPath === imagePath){
        //Network First then Offline Strategy
        event.respondWith(networkFirstStrategy(event.request));
    }else{ //for any image,page or site's resources
        //Offline First then Network Strategy i.e. we will look for resource specified in local cache and if that fails then return response from network and cache it
        event.respondWith(cacheFirstStrategy(event.request));
    }
});

function cacheFirstStrategy(request){
    return caches.match(request).then(function(cacheResponse){
        return cacheResponse || fetchRequestAndCache(request); //if cache fails then fetch from network
    });
}

function networkFirstStrategy(request){
    return fetchRequestAndCache(request).catch(function(response){ //when we're offline or request fails
        return caches.match(request); //search in caches and if it has older response for that request return that
    })
}

//Fetch Request And Cache
function fetchRequestAndCache(request){
    return fetch(request).then(function(networkResponse){
        caches.open(getCacheName(request)).then(function(cache) {
            cache.put(request, networkResponse);
        })
        return networkResponse.clone(); //cloned as it is already used. using same response again will make the process fail
    });
}

function getCacheName(request){
    var requestUrl = new URL(request.url);
    var requestPath = requestUrl.pathname;

    if(requestPath == imagePath){
        return carDealsCacheImagesName;
    }else if(requestPath == carPath){
        return carDealsCachePagesName;
    }else{
        return carDealsCacheName;
    }
}