const inquirer = require('inquirer');
const db = require('./db');

const mainMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update employee role',
        'Exit',
      ],
    },
  ]);

  switch (action) {
    case 'View all departments':
      await viewDepartments();
      break;
    case 'View all roles':
      await viewRoles();
      break;
    case 'View all employees':
      await viewEmployees();
      break;
    case 'Add a department':
      await addDepartment();
      break;
    case 'Add a role':
      await addRole();
      break;
    case 'Add an employee':
      await addEmployee();
      break;
    case 'Update employee role':
      await updateEmployeeRole();
      break;
    case 'Exit':
      console.log('Goodbye!');
      process.exit();
  }
  mainMenu();
};

const viewDepartments = async () => {
  try {
    const res = await db.query('SELECT id, name FROM department');
    console.table(res.rows);
  } catch (err) {
    console.error('Error fetching departments:', err);
  }
};

const viewRoles = async () => {
  try {
    const res = await db.query(`
      SELECT role.id, role.title, department.name AS department, role.salary
      FROM role
      JOIN department ON role.department_id = department.id
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error fetching roles:', err);
  }
};

const viewEmployees = async () => {
  try {
    const res = await db.query(`
      SELECT 
        e.id, 
        e.first_name, 
        e.last_name, 
        role.title, 
        department.name AS department, 
        role.salary,
        CONCAT(m.first_name, ' ', m.last_name) AS manager
      FROM employee e
      JOIN role ON e.role_id = role.id
      JOIN department ON role.department_id = department.id
      LEFT JOIN employee m ON e.manager_id = m.id
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error fetching employees:', err);
  }
};

const addDepartment = async () => {
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the new department:',
    },
  ]);

  try {
    await db.query('INSERT INTO department (name) VALUES ($1)', [name]);
    console.log(`Department "${name}" added successfully!`);
  } catch (err) {
    console.error('Error adding department:', err);
  }
};

const addRole = async () => {
  // Fetch departments so user can select one
  const depRes = await db.query('SELECT id, name FROM department');
  const departments = depRes.rows;

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Enter the title for the new role:',
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Enter the salary for the new role:',
      validate: (input) => !isNaN(parseFloat(input)) || 'Please enter a valid number.',
    },
    {
      type: 'list',
      name: 'department_id',
      message: 'Select the department for the new role:',
      choices: departments.map(dep => ({ name: dep.name, value: dep.id })),
    },
  ]);

  try {
    await db.query(
      'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
      [answers.title, answers.salary, answers.department_id]
    );
    console.log(`Role "${answers.title}" added successfully!`);
  } catch (err) {
    console.error('Error adding role:', err);
  }
};

const addEmployee = async () => {
  // Fetch roles and employees for manager selection
  const roleRes = await db.query('SELECT id, title FROM role');
  const roles = roleRes.rows;
  const empRes = await db.query('SELECT id, first_name, last_name FROM employee');
  const employees = empRes.rows;

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'first_name',
      message: "Enter the employee's first name:",
    },
    {
      type: 'input',
      name: 'last_name',
      message: "Enter the employee's last name:",
    },
    {
      type: 'list',
      name: 'role_id',
      message: "Select the employee's role:",
      choices: roles.map(role => ({ name: role.title, value: role.id })),
    },
    {
      type: 'list',
      name: 'manager_id',
      message: "Select the employee's manager:",
      choices: [
        { name: 'None', value: null },
        ...employees.map(emp => ({
          name: `${emp.first_name} ${emp.last_name}`,
          value: emp.id,
        })),
      ],
    },
  ]);

  try {
    await db.query(
      'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
      [answers.first_name, answers.last_name, answers.role_id, answers.manager_id]
    );
    console.log(`Employee "${answers.first_name} ${answers.last_name}" added successfully!`);
  } catch (err) {
    console.error('Error adding employee:', err);
  }
};

const updateEmployeeRole = async () => {
  // Fetch employees and roles
  const empRes = await db.query('SELECT id, first_name, last_name FROM employee');
  const employees = empRes.rows;
  const roleRes = await db.query('SELECT id, title FROM role');
  const roles = roleRes.rows;

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'employee_id',
      message: 'Select the employee to update:',
      choices: employees.map(emp => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id,
      })),
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'Select the new role:',
      choices: roles.map(role => ({ name: role.title, value: role.id })),
    },
  ]);

  try {
    await db.query('UPDATE employee SET role_id = $1 WHERE id = $2', [
      answers.role_id,
      answers.employee_id,
    ]);
    console.log('Employee role updated successfully!');
  } catch (err) {
    console.error('Error updating employee role:', err);
  }
};

// Start the application
mainMenu();
