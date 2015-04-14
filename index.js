/**
 * Created by islam on 4/12/15.
 */
angular.module('myApp', []).run(['realTimeService','randomService',
function(realTimeService, randomService){
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
        var foodCreatedCount = 0;
        var currentDirection = 'right';
        var matchController = null;
        var playerIndex = null;
        var isGameOver = false;
        /*********************************************************************
         *
         * Primary API functions
         *********************************************************************/


        //initalize the game
        function gotStartMatch(params){
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
                hasCollidedWithBody(nextCoordinate.x,nextCoordinate.y, playerIndex)){

                endMatch();
                return;
           }

           if(hasFood(nextCoordinate.x,nextCoordinate.y)){
               allScores[playerIndex]++;
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
                food = {
                    x:randomService.randomFromTo(foodCreatedCount, 0, numberOfColumns),
                    y:randomService.randomFromTo(foodCreatedCount + 1, 0, numberOfRows)
                };

                foodCreatedCount++;
                updateSpeed();
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

        function endMatch(){
            isGameOver = true;
            matchController.endMatch(allScores);
            stopDrawing();
        }

        function isOnBoard(x,y){
            if(x < 0 || x > canvasWidth || y < 0 || y > canvasHeight){
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