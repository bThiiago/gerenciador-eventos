import axios, { CancelTokenSource } from 'axios';

const createCancelTokenSource = () : CancelTokenSource => {
    const source = axios.CancelToken.source();
    return source;
};

export default createCancelTokenSource;