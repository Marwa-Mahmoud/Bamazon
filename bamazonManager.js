var mysql = require('mysql');
var inquirer = require('inquirer');
var Table = require('cli-table');



var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    port: 8889,
    database: 'bamazon'
});

connection.connect(function(err){

    if(err) throw err;
    console.log("\n============================");
    console.log("Connected to Manager View");
    console.log("==============================\n");
    start();

});

function start(){
    inquirer.prompt([{
        name: 'managerChoice',
        type: 'list',
        choices: ['View Products for Sale', 'View Low Inventory', 'Add to Inventory', 'Add New Product'],
        message: "\n=================================\nChoose from the following list\n =================================\n"
    }]).then(function(answers){

        switch(answers.managerChoice){
            case 'View Products for Sale': 
                viewProducts(); 
                break;
            case 'View Low Inventory': 
                viewLowInventory();
                break;
            case 'Add to Inventory': 
                addToInventory();
                break;
            case 'Add New Product': 
                addNewProduct();
                break;
        }
        
    });
}


function viewProducts(){

    var productsArray = [];
    var query = connection.query(
        "SELECT * FROM products",
        function(err, res){
            if(err) throw err;
            var table = new Table({
                head: ['Product ID', 'Product Name', 'Department Name', 'Price', 'Stock Quantity', 'Product Sales']
            });
            for(var i = 0; i < res.length; i++){
                table.push([res[i].item_id, res[i].product_name , res[i].department_name, res[i].price,  res[i].stock_quantity, res[i].product_sales]);
            }
            console.log(table.toString());

            continueOrLeave();  
        }
    )   

}

function viewLowInventory(){

    var query = connection.query(
        "SELECT * FROM products WHERE ?? < ?",
        ['stock_quantity',  5],
        function(err, res){
            var table = new Table({
                head: ['Product ID', 'Product Name', 'Department Name', 'Price', 'Stock Quantity']
            });
            for(var i = 0; i < res.length; i++){
                table.push([res[i].item_id, res[i].product_name , res[i].department_name, res[i].price,  res[i].stock_quantity]);
            }
            console.log("Items with Stock Quantity less than 5 ")
            console.log(table.toString());
            continueOrLeave();  
        }
    )

}

function addToInventory(){

    productsArray = [];

    var query = connection.query(
        "SELECT * FROM products",
        function(err, res){
            if(err) throw err;
    
            for(var i=0; i<res.length; i++){
                productsArray.push(res[i].item_id + " | " + res[i].product_name + " | " + res[i].department_name + " | " + res[i].price + " | " + res[i].stock_quantity);
            }
            itemSelection();
        }
    ); 

    function itemSelection(){

        inquirer.prompt([{
            name: 'itemToAddTo',
            type: 'list',
            choices: productsArray,
            message: 'Choose the item you want to add to:'
        },
        {
            name: 'amountToAdd',
            type: 'input',
            message: 'Enter the added amount:',
            validate: function(value){
                if(isNaN(value) === false)
                    return true;
                else
                    return "Please enter a valid number";
            }

         }]).then(function(answers){

            var selectedItemId = (answers.itemToAddTo.split(" |"))[0];
            
                    var query = connection.query(

                        "SELECT stock_quantity FROM products WHERE ?",
                        {
                            item_id: selectedItemId
                        },
                        function(err, res){
                            if(err) throw err;
                            var newStock = parseInt(res[0].stock_quantity) + parseInt(answers.amountToAdd);

                            var query = connection.query(
                                "UPDATE products SET ? WHERE ? ",
                                [
                                    {
                                        stock_quantity: newStock
                                    },
                                    {
                                        item_id: selectedItemId
                                    }
                                ],
                                function(err, res){
                                    if(err) throw err;
                                    console.log("The inventory is updated");
                                    continueOrLeave(); 
                                }
                            )
                    
    
                        }
                    );     
        });
    }



}

function addNewProduct(){

    var departmentsArr = [];
    var query = connection.query(
        "SELECT department_name FROM departments",
        function(err, res){
            if(err) throw err;
            for (var i = 0; i < res.length; i++) {
                departmentsArr.push(res[i].department_name);   
            }
            managerEntersProduct();
        }
    )

    function managerEntersProduct(){

        inquirer.prompt([
            {
                name: 'productName',
                type: 'input',
                message: 'What is the name of the product you want to add?'
            },
            {
                name: 'departmentName',
                type: 'list',
                choices: departmentsArr,
                message: 'Which department?'
            },
            {
                name: 'price',
                type: 'input',
                message: 'What is the price of this product?',
                validate: function(value){
                    if(isNaN(value) === false)
                        return true;
                    else
                        return 'Please enter a valid number'
                }
            },
            {
                name: 'stockQuantity',
                type: 'input',
                message: 'What is the quantity of this product?',
                validate: function(value){
                    if(isNaN(value) === false)
                        return true;
                    else
                        return 'Please enter a valid number'
                }
            }
           
        ]).then(function(answers){

            var query = connection.query(
                "SELECT department_name FROM products WHERE ?",
                {
                    product_name: answers.productName
                },
                function(err, res){
                    if(err) throw err;
                    if(res.length > 0){
                        console.log("This product already exists in the department you selected.\nEither change the department or add to the existing department");
                        continueOrLeave();
                    }
                    else{
                        var query = connection.query(
                            "INSERT INTO products SET ?",
                            {
                                product_name: answers.productName,
                                department_name: answers.departmentName,
                                price: answers.price,
                                 stock_quantity: answers.stockQuantity
                            },
                        function(err, res){
                            if(err) throw err;
                            console.log("New product added.");
                            continueOrLeave();
                        })
                    }
                }
            )

        })
        
    }


}

function continueOrLeave(){
    inquirer.prompt([{
        type: "confirm",
        message: "Continue?",
        name: "confirm",
        default: true
    }]).then(function(answers){
        if(answers.confirm)
            start();
        else{
            console.log("End of session");
            connection.end();
        }
    });
}
