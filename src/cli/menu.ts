import inquirer from 'inquirer';

export async function runInteractiveMenu() {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'mainAction',
      message: 'what do you want',
      choices: [
        { name: 'creae new oto', value: 'new' },
        { name: 'list of otp', value: 'history' },
        { name: 'exit', value: 'exit' }
      ]
    }
  ]);

  switch (answer.mainAction) {
    case 'new':

    break;
    case 'history':
      
      break;
    case 'exit':
      process.exit();
  }
}