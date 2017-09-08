var inquirer = require('inquirer');
var mysql = require('mysql');
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
    console.log("Connected to supervisor view");
    console.log("==============================\n");
    start();

});

function start(){

    inquirer.prompt([{
        name: 'supervisorChoice',
        type: 'list',
        message: 'Choose from the following:',
        choices: ['View Product Sales By Department', 'Create New Department']
    }]).then(function(answers){
        if(answers.supervisorChoice === 'View Product Sales By Department')
            viewSalesByDepartment();
        else
            createDepartment();
    });

}


function viewSalesByDepartment(){

    var query = connection.query(
        "SELECT departments.department_id AS department_id, departments.department_name AS department_name, departments.over_head_costs AS over_head_costs, SUM(products.product_sales) AS product_sales FROM departments JOIN products ON  departments.department_name=products.department_name GROUP BY department_name",
        function(err, res){
            if(err) throw err;
            var tableArray = [];
            var table = new Table({
                head: ['Department ID', 'Department Name', 'Over Head Cost', 'Product Sales', 'Total Profit']
            });
            for(var i = 0; i < res.length; i++){
                var departmentTotalProfit = (res[i].product_sales - res[i].over_head_costs)
                table.push([res[i].department_id, res[i].department_name, res[i].over_head_costs, res[i].product_sales, departmentTotalProfit]);
            }
        
            console.log(table.toString());
            continueOrLeave();
        }
    )

}

function createDepartment(){
    inquirer.prompt([
    {
        name: 'departmentName',
        type: 'input',
        message: 'Please enter the department name'
    },
    {
        name: 'departmentOveheadCost',
        type: 'input',
        validate: function(value){
            if(!isNaN(value))
                return true;
            else 
                return false;
        },
        message: "Please enter the Over Head Cost"
    }

]).then(function(answers){
    console.log(answers);
    var query = connection.query(
        "SELECT * FROM departments WHERE ?",
        {
            department_name: answers.departmentName
        },
        function(err, res){
            if(err) throw err;
            if(res.length > 0){
                console.log("Sorry, Department Name already exists. Cannot complete transacrion.");
                continueOrLeave();
            }
            else{
                var query = connection.query(
                    "INSERT INTO departments SET ?",
                    {
                        department_name: answers.departmentName,
                        over_head_costs: answers.departmentOveheadCost
                    },
                    function(err, results){
                        if(err) throw err;
                        console.log("Departments Updated");
                        continueOrLeave();
                    }

                )
            }
        }
    )
})

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