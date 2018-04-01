$(()=>{
    var grid=$('.mdl-grid');
    fetchCars((cars)=>{
        $('#first-load').hide();
        var cardHTML="";
        console.log(cars.length);
        for(var i=0;i<cars.length;i++){
            var temp=generateCar(cars[i].value);
            cardHTML=cardHTML+temp;
        }
        console.log(cardHTML);
        grid.append(cardHTML);
        $('.mdl-layout__content').css({'display':'inline-block'});

    });
});

function generateCar(car) {
    var g=car.brand+" "+car.year+" "+car.price;
    var x=`<div class="mdl-card mdl-cell mdl-cell--4-col mdl-shadow--6dp" style="background-image: url('${car.image}')">
        <div class="mdl-card__title">
        <span class="mdl-card__title-text">${g} (${car.price})</span>
</div>
</div>`;
    return x;
}

function fetchCars(callback) {
    $.get('http://bstavroulakis.com/pluralsight/courses/progressive-web-apps/service/latest-deals.php',
        (data)=>{
        console.log(data);
            callback(data.cars);
        }
        )
}