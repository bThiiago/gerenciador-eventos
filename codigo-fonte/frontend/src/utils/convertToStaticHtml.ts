import ReactDOMServer from 'react-dom/server';

const convertToStaticHtml = (element: React.ReactElement) : string => {
    return ReactDOMServer.renderToString(element);
};

export default convertToStaticHtml;