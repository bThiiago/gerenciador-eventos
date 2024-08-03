import React, { forwardRef } from 'react';
import { Button, InputGroup, InputRightElement } from '@chakra-ui/react';
import Input from '../Input';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

type PasswordProps = React.HTMLProps<HTMLInputElement>;

export const CustomPassword = forwardRef<HTMLInputElement, PasswordProps>(() => {
    const [show, setShow] = React.useState(false);
    const handleClick = () => setShow(!show);

    return (
        <InputGroup size="md">
            <Input
                pr="4rem"
                type={show ? 'text' : 'password'}
                name="password"
                placeholder="Senha"
                maxLength={60}
            />
            <InputRightElement  marginTop="0.7rem" width="20">
                <Button
                    background="White"
                    color="gray.500"
                    minW="5"
                    h="1.75rem"
                    size="md"
                    onClick={handleClick}
                >
                    {show ? (
                        <ViewIcon height="6" width="6" />
                    ) : (
                        <ViewOffIcon height="6" width="6" />
                    )}
                </Button>
            </InputRightElement>
        </InputGroup>
    );
});

CustomPassword.displayName = 'CustomPassword';