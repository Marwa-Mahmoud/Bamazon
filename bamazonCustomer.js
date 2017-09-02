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
    console.log("Welcome to our store! You are connected!");

});

var query = connection.query(
    "SELECT * FROM products",
    function(err, res){
        if(err) throw err;
        console.log("This is a list of our products: \n");
        for(var i=0; i<res.length; i++){
            arrayOfItemsIds.push(res[i].item_id.toString());
            arrayOfItems.push(res[i].item_id + " | " + res[i].product_name + " | " + res[i].price);
            console.log(res[i].item_id + " | " + res[i].product_name + " | " + res[i].price)
        }
       
        userOrder();
    }
)

function userOrder(){
    console.log(arrayOfItemsIds);
    var arr = arrayOfItemsIds;
    inquirer.prompt([{
        name: "productId",
        type: 'list',
       choices: arrayOfItems,
        message: 'Choose the ID of the product that you would like to buy ...\n',
  
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
        console.log(selectedItemId);

        var query = connection.query(
            "SELECT stock_quantity FROM products WHERE ?",
            {
                item_id: selectedItemId
            },
            function(err, res){

                if(err) throw err;
                console.log(res);

                if(answers.productCount > res[0].stock_quantity){
                    console.log("There is no enough stock form the poduct you orderd. Please come back later.\n");
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
                                "SELECT price FROM products WHERE ?",
                                {
                                    item_id: answers.productId   
                                },
                                function(err, res){
                                    if(err) throw err;
                                    console.log("You cost is: " + res[0].price * answers.productCount);
                                }
                            )
                        }
                    )

                }
            }
        )

    });
}
