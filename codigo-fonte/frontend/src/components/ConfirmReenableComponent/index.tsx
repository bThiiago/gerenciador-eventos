import React from 'react';
import PropTypes from 'prop-types';
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay
} from '@chakra-ui/modal';
import CustomButton from 'components/Button';
import COLORS from 'constants/COLORS';

interface ConfirmReenableProps {
    handleReenable : () => void;
    modalOpen : boolean;
    setModalOpen : (value : boolean) => void;
    customTitle ?: string;
    customMessage ?: string;
    customModal ?: boolean;
}

const ConfirmReenableComponent: React.FC<ConfirmReenableProps> = ({ modalOpen, setModalOpen, handleReenable: handleDelete, customTitle, customMessage, customModal }) => {
    return (
        <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{customTitle ? customTitle : 'Deseja realmente reativar?'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {customMessage ? customMessage  : ''}
                </ModalBody>
                {!customModal ? (
                    <ModalFooter>
                        <CustomButton
                            style={{
                                backgroundColor: COLORS.success,
                                marginRight: '0.8rem',
                            }}
                            onClick={handleDelete}
                        >
                            Reativar
                        </CustomButton>
                        <CustomButton style={{ backgroundColor: COLORS.danger }} onClick={() => setModalOpen(false)}>
                            Cancelar
                        </CustomButton>
                    </ModalFooter>
                ): (
                    <ModalFooter>
                        <CustomButton style={{ backgroundColor: COLORS.danger }} onClick={() => setModalOpen(false)}>
                            Sair
                        </CustomButton>
                    </ModalFooter>
                ) }
            </ModalContent>
        </Modal>
    );
};

ConfirmReenableComponent.propTypes = {
    handleReenable: PropTypes.func.isRequired,
    modalOpen : PropTypes.bool.isRequired,
    setModalOpen : PropTypes.func.isRequired,
    customTitle : PropTypes.string,
    customMessage : PropTypes.string,
    customModal : PropTypes.bool,
};

export default ConfirmReenableComponent;