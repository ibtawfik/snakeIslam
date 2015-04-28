/**
 * Created by islam on 4/12/15.
 */
angular.module('myApp', []).run(['$translate','realTimeService','randomService',
function($translate, realTimeService, randomService){
    'use strict';

    var canvasWidth = 300;
    var canvasHeight =300;
    var cellWidth =10;
    var cellHeight =10;
    var numberOfRows = canvasHeight/cellHeight;
    var numberOfColumns = canvasWidth/cellWidth;
    var drawingSpeed = 120;
    var drawingInterval;

    var playerColor = ['blue','red','brown','purple', 'pink','yellow','orange','silver'];




    function createCanvasController(canvas)
    {
        var allSnakes =[];
        var allScores =[];
        var food;
        var obsticles=[];
        var foodCreatedCount = 0;
        var currentDirection = 'right';
        var matchController = null;
        var playerIndex = null;
        var isGameOver = false;
        /*********************************************************************
         *
         * Primary API functions
         *********************************************************************/
         function resetGame(params){
            var numberOfPlayers = params.playersInfo.length;
            isGameOver = false;
            allScores=[];
            for(var i = 0; i<numberOfPlayers;i++){
                allScores.push(0);
            }
            obsticles=[];
            currentDirection = 'right';
            foodCreatedCount = 0;


        }

        //initalize the game
        function gotStartMatch(params){
            resetGame(params);
            //a snake is an array of each block in the snake
            playerIndex = params.yourPlayerIndex;
            matchController = params.matchController;

            //Create current snake, will change when going to mutiplayer
            allSnakes[playerIndex] = createSnake(playerIndex);

            //Create the first food
            createFood();
            updateSpeed();

        }

        //update the match state
        function gotMessage(params){

        }

        function gotEndMatch(endMatchScores){
            allScores = endMatchScores;
            isGameOver = true;
            stopDrawing();
        }

        //send a messae to other players, not implemented this week
        function sendMessage(isReliable){
            if(isReliable){
                matchController.sendReliableMessage(messageString);
            }else{
                matchController.sendUnreliableMessage(messageString);
            }
        }

        /*********************************************************************
         *
         * Snake related functions
         *********************************************************************/
        function gameLoop(){

           if(isGameOver){
               return;
           }

           var nextCoordinate = move(playerIndex);

            if(!isOnBoard(nextCoordinate.x,nextCoordinate.y) ||
                hasCollidedWithBody(nextCoordinate.x,nextCoordinate.y, playerIndex) ||
                hasCollidedWithObsticle(nextCoordinate.x,nextCoordinate.y,playerIndex)){

                endMatch();
                return;
           }

           if(hasFood(nextCoordinate.x,nextCoordinate.y)){
               allScores[playerIndex]++;
               createObsticale(playerIndex);
               createFood();
           }else{
               allSnakes[playerIndex].shift();
           }
               allSnakes[playerIndex].push(nextCoordinate);

           draw();
        }

        function createSnake(index){
            var length = 5;
            var snake =[];
            for(var i = 0; i<length; i++){
                //space out the snakes a bit at the begining
                snake.push({x: i, y: index * Math.floor(canvasHeight/playerColor.length)});
            }

                return snake;
            }

            function createFood(){
                var x = randomService.randomFromTo(foodCreatedCount, 0, numberOfColumns);
                var y = randomService.randomFromTo(foodCreatedCount, 0, numberOfColumns);

                while(hasObsticle(x,y)){
                    foodCreatedCount++;
                    x = randomService.randomFromTo(foodCreatedCount, 0, numberOfColumns);
                    y = randomService.randomFromTo(foodCreatedCount, 0, numberOfColumns);
                }

                foodCreatedCount++;
                food = {
                    x:x,
                    y:y
                };


                updateSpeed();
            }


        function hasObsticle(x,y){
            for (var i = 0; i < obsticles.length;i++){
                if(obsticles[i].x === x && obsticles[i].y === y){
                    return true;
                }else{
                    return false;
                }
            }
        }

        /**
         * When a snake eats food leave an obsticle behind it.
         * @param snakeIndex
         */
            function createObsticale(snakeIndex){
                //at the tail of the snake create an obsticle
                var snake = allSnakes[snakeIndex];
                var tailCoordinates = snake[0];
                var x = tailCoordinates.x;
                var y = tailCoordinates.y;
                var direction = tailDirection(snakeIndex);

                if(direction === 'left'){
                    x--;
                    x--;

                }else if(direction === 'right'){
                    x++;
                    x++;

                }else if(direction === 'up'){
                    y--;
                    y--;

                }else if(direction === 'down'){
                    y++;
                    y++;
                }

                obsticles.push({x:x, y:y});
            }
            //Checks the direction of the tail so that we can place obstacles appropriately
            function tailDirection(snakeIndex){
                var snake = allSnakes[snakeIndex];
                var tailCoordinates = snake[0];
                var nextCoordinate = snake [1];

                if(tailCoordinates.x > nextCoordinate.x){
                    return 'left';
                }else if(tailCoordinates.x < nextCoordinate.x){
                    return 'right';
                }else if(tailCoordinates.y > nextCoordinate.y){
                    return 'up';
                }else{
                    return 'down';
                }



            }

            function updateSpeed(){
                stopDrawing();
                //Choosing a less aggressive speed up function
                var newSpeed = Math.max(50, drawingSpeed - 5 * Math.floor(foodCreatedCount/2));

                //TO DO implement update and draw function
                drawingInterval = setInterval(gameLoop,newSpeed);
            }

            function stopDrawing(){
                clearInterval(drawingInterval);
            }

        var directionQueue =[];

        function  move(snakeIndex){

            var nextDirection = directionQueue.shift();


            if(nextDirection !== oppositeDirection(currentDirection) && nextDirection !== undefined){
                currentDirection = nextDirection;
            }

            var currentSnake = allSnakes[snakeIndex];
            var x = currentSnake[currentSnake.length - 1].x;
            var y = currentSnake[currentSnake.length - 1].y;

            if(currentDirection === 'left'){
                x--;
            }else if(currentDirection === 'right'){
                x++;
            }else if(currentDirection === 'up'){
                y--;
            }else if(currentDirection === 'down'){
                y++;
            }

            return {x:x, y:y};
        }

        function oppositeDirection(direction){
            if(direction === 'right'){
                return 'left';
            }else if(direction === 'left'){
                return 'right';
            }else if(direction === 'up'){
                return 'down';
            }else if(direction === 'down'){
                return 'up';
            }
        }

        function addDirection(direction){
            //ignore going backwards
            if(directionQueue.length > 0 && direction[directionQueue.length - 1] === direction){
                return;
            }
            //Otherwise add the new direction
            directionQueue.push(direction);
        }

        function hasCollidedWithBody(x,y,snakeIndex){
            var snake = allSnakes[snakeIndex];
            for(var i = 0;i < snake.length; i++){
                if(snake[i].x === x &&  snake[i].y === y){
                    return true;
                }
            }

            return false;
        }

        function hasCollidedWithObsticle(x,y,snakeIndex){
            for(var i = 0 ; i < obsticles.length; i++){

                if(obsticles[i].x === x && obsticles[i].y === y){
                    return true;
                }

            }
            return false;
        }

        function endMatch(){
            isGameOver = true;
            matchController.endMatch(allScores);
            stopDrawing();
        }

        function isOnBoard(x,y){
            if(x < 0 || x >= numberOfRows || y < 0 || y >= numberOfColumns){
                return false;
            }else{
                return true;
            }
        }

        function hasFood(x,y){
            if(food.x === x && food.y === y){
                return true;
            }
        }

        /*********************************************************************
         *
         * Canvas related functions
         *********************************************************************/

         var context = canvas.getContext("2d");

        function draw(){
            reDrawBoard();

            //Draw the snakes
            for (var i = 0; i < allSnakes.length ; i++){
                if (i != playerIndex){
                    drawSnake(i);
                }
            }

            drawSnake(playerIndex);
            drawFood(food.x,food.y);
            drawObsticles();
            //drawScores();
        }

        function reDrawBoard(){

            context.fillstyle = "black";
            context.fillRect(0,0,canvasWidth,canvasHeight);

        }

        function drawSnake(snakeIndex){
            var snake = allSnakes[snakeIndex];
            //Draw each segment of the snake
            for (var i = 0; i < snake.length; i++ ){
                var cell = snake[i];
                drawSnakeBodyPart(cell.x, cell.y, snakeIndex);
                drawFood(food.x,food.y);
            }
        }

        function drawObsticles(){
            for (var i = 0; i < obsticles.length; i++){
                var cell = obsticles[i];
                drawObsitcle(cell.x, cell.y);
            }
        }

        function drawObsitcle(x,y){
            //Why is the entire board being painted with the fillstyle??

            context.fillStyle = "red";
            context.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
            context.strokeStyle = 'white';
            context.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight)

        }

        function drawSnakeBodyPart(x,y,snakeIndex){
            var color = playerColor[snakeIndex];

            context.fillStyle = color;
            context.fillRect(x * cellWidth, y * cellHeight, cellWidth ,cellHeight);

        }

        //Seprate function because going to change to an image instead of a block
        function drawFood(x,y){

            context.fillStyle = 'green';
            context.fillRect(x * cellWidth, y * cellHeight,cellWidth,cellHeight);

            context.strokeStyle = "white";
            context.strokeRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);

        }

        function drawScores(){
            for (var i = 0; i < allScores.length; i++) {
                context.font = '12px sans-serif';
                var color = playerColor[i];
                context.fillStyle = color;
                var msg = $translate.instant("COLOR_SCORE_IS",
                    {color: $translate.instant(color.toUpperCase()), score: "" + allScores[i]});
                context.fillText(msg,
                        5 + i * canvasWidth / allSnakes.length, canvasHeight - 5);
            }
        }

        /*********************************************************************
         *
         * Keyboard related functions
         *********************************************************************/
        document.addEventListener("keydown", function(e){
            var key = e.which;
            var dir = key === 37 ? "left"
                : key === 38 ? "up"
                : key === 39 ? "right"
                : key === 40 ? "down" : null;
            if (dir !== null) {
                addDirection(dir);
            }
        }, false);

        var lastX = null, lastY = null;
        function processTouch(e) {
            e.preventDefault(); // prevent scrolling and dispatching mouse events.
            var touchobj = e.targetTouches[0]; // targetTouches includes only touch points in this canvas.
            if (!touchobj) {
                return;
            }
            if (lastX === null) {
                lastX = touchobj.pageX;
                lastY = touchobj.pageY;
                return;
            }
            var distX = touchobj.pageX - lastX; // get horizontal dist traveled by finger while in contact with surface
            var distY = touchobj.pageY - lastY; // get vertical dist traveled by finger while in contact with surface
            var swipedir = null;
            var absDistX = Math.abs(distX);
            var absDistY = Math.abs(distY);
            if (absDistX >= 20 || absDistY >= 20) {
                lastX = touchobj.pageX;
                lastY = touchobj.pageY;
                if (absDistX > absDistY) {
                    swipedir = distX < 0 ? 'left' : 'right';
                } else {
                    swipedir = distY < 0 ? 'up' : 'down';
                }
                addDirection(swipedir);
            }
        }
        canvas.addEventListener('touchstart', function(e) {
            lastX = null;
            lastY = null;
            processTouch(e);
        }, false);
        canvas.addEventListener('touchmove', function(e) {
            processTouch(e);
        }, false);
        canvas.addEventListener('touchend', function(e) {
            processTouch(e);
        }, false);

        return{
            gotStartMatch: gotStartMatch,
            gotMessage: gotMessage,
            gotEndMatch: gotEndMatch
        };
    }
    realTimeService.init({
        createCanvasController: createCanvasController,
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
    });
}]);