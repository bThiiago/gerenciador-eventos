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

interface ConfirmDeleteProps {
    handleDelete : () => void;
    modalOpen : boolean;
    setModalOpen : (value : boolean) => void;
    customTitle ?: string;
    customMessage ?: string;
    customModal ?: boolean;
}

const ConfirmDeleteComponent: React.FC<ConfirmDeleteProps> = ({ modalOpen, setModalOpen, handleDelete, customTitle, customMessage, customModal }) => {
    return (
        <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{customTitle ? customTitle : 'Deseja realmente excluir?'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {customMessage ? customMessage  : 'Essa operação é irreversível.'}
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
                            Excluir
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

ConfirmDeleteComponent.propTypes = {
    handleDelete: PropTypes.func.isRequired,
    modalOpen : PropTypes.bool.isRequired,
    setModalOpen : PropTypes.func.isRequired,
    customTitle : PropTypes.string,
    customMessage : PropTypes.string,
    customModal : PropTypes.bool,
};

export default ConfirmDeleteComponent;
