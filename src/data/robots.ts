export interface Robot {
  id: string;
  name: string;
  model: string;
  price: number;
  dailyIncome: number;
  cycleDays: number;
  totalIncome: number;
  image: string;
}

export const ROBOTS: Robot[] = [
  { id: 'r2d2', name: 'R2-D2', model: 'Star Wars', price: 20000, dailyIncome: 2000, cycleDays: 30, totalIncome: 60000, image: '/assets/robotCars.svg' },
  { id: 'c3po', name: 'C-3PO', model: 'Star Wars', price: 30000, dailyIncome: 3000, cycleDays: 30, totalIncome: 90000, image: '/assets/robotCars.svg' },
  { id: 'walle', name: 'WALL-E', model: 'WALL-E', price: 40000, dailyIncome: 4000, cycleDays: 30, totalIncome: 120000, image: '/assets/robotCars.svg' },
  { id: 't800', name: 'The Terminator / T-800', model: 'The Terminator', price: 50000, dailyIncome: 5000, cycleDays: 30, totalIncome: 150000, image: '/assets/robotCars.svg' },
  { id: 'bender', name: 'Bender', model: 'Futurama', price: 60000, dailyIncome: 6000, cycleDays: 30, totalIncome: 180000, image: '/assets/robotCars.svg' },
  { id: 'optimus', name: 'Optimus Prime', model: 'Transformers', price: 100000, dailyIncome: 10000, cycleDays: 30, totalIncome: 300000, image: '/assets/robotCars.svg' },
  { id: 'irongiant', name: 'The Iron Giant', model: 'The Iron Giant', price: 150000, dailyIncome: 15000, cycleDays: 30, totalIncome: 450000, image: '/assets/robotCars.svg' },
  { id: 'data', name: 'Data', model: 'Star Trek', price: 200000, dailyIncome: 20000, cycleDays: 30, totalIncome: 600000, image: '/assets/robotCars.svg' },
  { id: 'johnny5', name: 'Johnny 5', model: 'Short Circuit', price: 250000, dailyIncome: 25000, cycleDays: 30, totalIncome: 750000, image: '/assets/robotCars.svg' },
  { id: 'baymax', name: 'Baymax', model: 'Big Hero 6', price: 300000, dailyIncome: 30000, cycleDays: 30, totalIncome: 900000, image: '/assets/robotCars.svg' },
  { id: 'marvin', name: 'Marvin the Paranoid Android', model: 'The Hitchhiker\'s Guide', price: 350000, dailyIncome: 35000, cycleDays: 30, totalIncome: 1050000, image: '/assets/robotCars.svg' },
  { id: 'robby', name: 'Robby the Robot', model: 'Forbidden Planet', price: 400000, dailyIncome: 40000, cycleDays: 30, totalIncome: 1200000, image: '/assets/robotCars.svg' },
  { id: 'atlas', name: 'Atlas', model: 'Boston Dynamics', price: 500000, dailyIncome: 50000, cycleDays: 30, totalIncome: 1500000, image: '/assets/robotCars.svg' },
  { id: 'sophia', name: 'Sophia', model: 'Hanson Robotics', price: 600000, dailyIncome: 60000, cycleDays: 30, totalIncome: 1800000, image: '/assets/robotCars.svg' },
  { id: 'ameca', name: 'Ameca', model: 'Engineered Arts', price: 700000, dailyIncome: 70000, cycleDays: 30, totalIncome: 2100000, image: '/assets/robotCars.svg' },
  { id: 'asimo', name: 'ASIMO', model: 'Honda', price: 800000, dailyIncome: 80000, cycleDays: 30, totalIncome: 2400000, image: '/assets/robotCars.svg' },
  { id: 'spot', name: 'Spot', model: 'Boston Dynamics', price: 900000, dailyIncome: 90000, cycleDays: 30, totalIncome: 2700000, image: '/assets/robotCars.svg' },
  { id: 'digit', name: 'Digit', model: 'Agility Robotics', price: 1000000, dailyIncome: 100000, cycleDays: 30, totalIncome: 3000000, image: '/assets/robotCars.svg' },
];
