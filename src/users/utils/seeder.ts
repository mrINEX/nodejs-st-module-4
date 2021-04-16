import { createConnection, getConnection, getConnectionManager } from 'typeorm';
import { User } from '../user.model';
import randomInteger from './random-int';
import config from '../../config';
const { typeORM } = config;

const [,,, quantity] = process.argv;

const validQuantity = Number.isNaN(Number(quantity)) ? undefined : +quantity;

runSeed(validQuantity);

export default async function runSeed(quantity = 20): Promise<void> {

  const hasConnections = getConnectionManager().connections.length;
  if (!hasConnections) {
    await createConnection(typeORM);
  }

  const connection = getConnection();
  const queryRunner = connection.createQueryRunner();

  await queryRunner.connect();
  await connection.synchronize();
  await queryRunner.startTransaction();

  try {
    const users = Array(quantity).fill('password').map((val, index) => {
      return queryRunner.manager.create(User, {
        login: `user #${index + 1}`,
        password: `${val}_${randomInteger(10, 100000)}_${index}`,
        age: randomInteger(3, 130)
      });
    })
    
    await queryRunner.manager.save(users);

    await queryRunner.commitTransaction();
  } catch (err) {
    console.log(`We have error, rollback changes we made. ${err}`);
    await queryRunner.rollbackTransaction();
  } finally {
    console.log('Seed successfully.');
    await queryRunner.release();
  }
}
