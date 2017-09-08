var mysql = require('mysql');
var inquirer = require('inquirer');
var arrayOfItems = [];
var arrayOfItemsIds = [];

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 8889,
    database: 'bamazon'
});

connection.connect(function(err){

    if(err) throw err;
    console.log("\n========================================");
    console.log("Welcome to our store! You are connected!");
    console.log("========================================\n");

});

var query = connection.query(
    "SELECT * FROM products",
    function(err, res){
        if(err) throw err;
        console.log("This is a list of our products:");
        for(var i=0; i<res.length; i++){
            arrayOfItemsIds.push(res[i].item_id.toString());
            arrayOfItems.push(res[i].item_id + " | " + res[i].product_name + " | " + res[i].price);
        }
       
        userOrder();
    }
)

function userOrder(){

    inquirer.prompt([{
        name: "productId",
        type: 'list',
       choices: arrayOfItems,
        message: 'Please choose the product that you would like to buy ...\n==============================================================\n'
  
    },
    {
        name: "productCount",
        type: 'input',
        message: 'How many units of the product you would like to buy?\n',
        validate: function(value){
            if(isNaN(value) === false)
                return true;
            else
                return "Please enter a valid number";
                
        }

    }]).then(function(answers){


        var selectedItemId = (answers.productId.split(" |"))[0];

        var query = connection.query(
            "SELECT product_name, stock_quantity FROM products WHERE ?",
            {
                item_id: selectedItemId
            },
            function(err, res){

                if(err) throw err;
                console.log('You selected '+ answers.productCount + ' items from the product "' + res[0].product_name + '"');

                if(answers.productCount > res[0].stock_quantity){
                    console.log("sorry there is not enough stock form the poduct you orderd. Please check this item later.\n");
                    continueOrLeave();
                }
                else{

                    console.log("Your order is being processed ...");
                    var query = connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [{
                            stock_quantity: (res[0].stock_quantity) - (answers.productCount)
                        },
                        {
                            item_id: answers.productId
                        }],
                        function(err, res){
                            if(err) throw err;
                            var query = connection.query(
                                "SELECT price, product_sales FROM products WHERE ?",
                                {
                                    item_id: answers.productId   
                                },
                                function(err, res){
                                    if(err) throw err;
                                    var cost = res[0].price * answers.productCount;
                                    var productSales = res[0].product_sales + cost;
                                    console.log("Your cost is: $" + cost);
                                    var query = connection.query(
                                        "UPDATE products SET ? WHERE ?",
                                        [
                                            {
                                                product_sales: productSales
                                            },
                                            {
                                                item_id: answers.productId
                                            }
                                        ],
                                        function(err, res){
                                            if(err) throw err;
                                            console.log("database updated");
                                            continueOrLeave();
                                        }
                                    )
                                   
                                }
                            )
                        }
                    )

                }



            }
        )

    });
}

function continueOrLeave(){
    inquirer.prompt([{
        type: "confirm",
        message: "Would you like to buy something else?",
        name: "confirm",
        default: true
    }]).then(function(answers){
        if(answers.confirm)
            userOrder();
        else{
            console.log("Thank you! Please come again later");
            connection.end();
        }
    });
}
