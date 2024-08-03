import { Container } from 'inversify';

const container = new Container({
    defaultScope: 'Singleton',
});

export {
    container
};
