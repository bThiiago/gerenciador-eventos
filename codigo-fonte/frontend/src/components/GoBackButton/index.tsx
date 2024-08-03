import { ArrowBackIcon } from '@chakra-ui/icons';
import CustomButton from 'components/Button';
import COLORS from 'constants/COLORS';
import React from 'react';
import { useHistory } from 'react-router';

const GoBackButton: React.FC = () => {
    const history = useHistory();

    return (
        <CustomButton
            style={{ marginBottom: '0.8rem', backgroundColor: COLORS.primaryLight }}
            onClick={() => history.goBack()}
        >
            <ArrowBackIcon style={{marginRight: '0.4rem'}} />
            Voltar
        </CustomButton>
    );
};

export default GoBackButton;
