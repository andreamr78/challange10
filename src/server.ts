import express from 'express';
import { QueryResult } from 'pg';
import { pool, connectToDb } from './connection.js';
import inquire from 'inquirer'

//npm run build

await connectToDb();

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function dataQuery(){
    inquire
    .prompt([
        {
            type: 'list',
            name: 'mainQuery',
            message: 'What do you want to do?',
            choices:[
                'View All Employees',
                'View All Roles',
                'View All Departments',
                'Add Department',
                'Add a Role',
                'Add an Employee',
                'Update an Employee Role'
            ] 
        }
    ])
    .then((answers) => {
        switch (answers.mainQuery) {
            case 'View All Employees':
                pool.query('SELECT * FROM employees', (err: Error, result: QueryResult) => {
                    if (err) {
                      console.log(err);
                    } else if (result) {
                      console.table(result.rows);
                      dataQuery();
                    }
                  });
            break;
            case 'View All Roles':
                pool.query('SELECT * FROM depto_role', (err: Error, result: QueryResult) => {
                    if (err) {
                      console.log(err);
                    } else if (result) {
                      console.table(result.rows);
                      dataQuery();
                    }
                  });
            break;
            case 'View All Departments':
                pool.query('SELECT * FROM departments', (err: Error, result: QueryResult) => {
                    if (err) {
                      console.log(err);
                    } else if (result) {
                      console.table(result.rows);
                      dataQuery();
                    }
                  });
            break;
            case 'Add Department':
                addDepartment();
            break;
            case 'Add a Role':
                addRole();
            break;
            case 'Add an Employee':
                addEmployee();
            break;
            case 'Update an Employee Role':
                UpdateEmployee();
            break;
            default:
            console.log('Error, please try again!');
                break;
        }
    })
}

function addDepartment(){
    inquire
    .prompt([
        {
            type: 'input',
            name: 'newDepto',
            message: 'Please write the name of the department to add',
            
        }
    ]) 
    .then((answers) => { 
        pool.query(`INSERT INTO departments(name) VALUES ('${answers.newDepto}');`, (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
              console.table(`${result.rowCount} department has been added!`);
              dataQuery();
            }
          });
    })
}

function addRole(){
  pool.query(`SELECT * FROM departments`, (err: Error, result: QueryResult) => {
    if (err) {
      console.log(err);
    } else {
      let deptoArray = result.rows.map(departments => ({
        name: departments.name,
        value: departments.id
      }));
      inquire
      .prompt([
          {
              type: 'input',
              name: 'title',
              message: 'Please write the name of the Role to add',
              
          },
          {
              type: 'input',
              name: 'salary',
              message: 'Please write the number of the Salary to add',
              
          },
          {
            type: 'list',
            name: 'deptos',
            message: 'Please select a department ',
            choices: deptoArray
        }
      ]) 
      .then((answers) => {
          pool.query(`INSERT INTO depto_role(title, salary, department_id) VALUES ('${answers.title}', ${parseInt(answers.salary)}, ${parseInt(answers.deptos)})`, (err: Error, result: QueryResult) => {
              if (err) {
                console.log(err);
              } else if (result) {
                console.table(`${result.rowCount} role has been added!`);
                dataQuery();
              }
            });
      })
    }
  });
}

function addEmployee(){
  let titleRole: { name: any; value: any; }[];
  let managerArray;
  pool.query(`SELECT * FROM depto_role`, (err: Error, result: QueryResult) => {
    if (err) {
      console.log(err);
    } else if (result) {
      titleRole = result.rows.map(depto_role => ({
        name: depto_role.title,
        value: depto_role.department_id
      }));
      pool.query(`SELECT * FROM employees`, (err: Error, result: QueryResult) => {
        if (err) {
          console.log(err);
        } else if (result) {
          managerArray = result.rows.map(employees => ({
            name: `${employees.first_name} ${employees.last_name}`,
            value: employees.manager_id
          }));

          inquire
          .prompt([
              {
                  type: 'input',
                  name: 'firstName',
                  message: 'Please write the first name of the Employee to add',
                  
              },
              {
                  type: 'input',
                  name: 'lastName',
                  message: 'Please write the last name of the Employee to add',
                  
              },
              {
                  type: 'list',
                  name: 'role',
                  message: `What is the Employee's Role?`,
                  choices: titleRole, 
              },
              {
                  type: 'list',
                  name: 'manager',
                  message: 'Please write the manager of the Employee to add',
                  choices: managerArray,  
                  
              },
          ])
          .then((answers) => {
            pool.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES  ('${answers.firstName}', '${answers.lastName}', ${parseInt(answers.role)}, ${parseInt(answers.manager)});`, (err: Error, result: QueryResult) => {
              if (err) {
                console.log(err);
              } else if (result) {
                console.table(`${result.rowCount} employee has been added!`);
                dataQuery();
              }
            });
          })

        }
      });

    }
  });
}
function UpdateEmployee(){
  let employeesArray: { name: string; value: any; }[];
  let titleRole;

  pool.query(`SELECT * FROM employees`, (err: Error, result: QueryResult) => {
    if (err) {
      console.log(err);
    } else if (result) {
      employeesArray = result.rows.map(employees => ({
        name: `${employees.first_name} ${employees.last_name}`,
        value: employees.manager_id
      }));

      pool.query(`SELECT * FROM depto_role`, (err: Error, result: QueryResult) => {
        if (err) {
          console.log(err);
        } else if (result) {
          titleRole = result.rows.map(depto_role => ({
            name: depto_role.title,
            value: depto_role.department_id
          }));

        inquire
          .prompt([
            {
              type: 'list',
              name: 'employee',
              message: 'Please select the name of the employee to update',
              choices: employeesArray,  
            },
            {
              type: 'list',
              name: 'role',
              message: 'Please select the title of the role to update',
              choices: titleRole,  
            },
          ]) 
          .then((answers) => { 
              pool.query( `UPDATE employees SET role_id = ${answers.role} WHERE id = ${answers.employee};`, (err: Error, result: QueryResult) => {
                  if (err) {
                    console.log(err);
                  } else if (result) {
                    console.table(`${result.rowCount} employee role has been Updated`);
                    dataQuery();
                  }
                });
          })
        } 
      });
    }
    
  });

}


// Default response for any other request (Not Found)
app.use((_req, res) => {
    res.status(404).end();
  });
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    dataQuery();
  });