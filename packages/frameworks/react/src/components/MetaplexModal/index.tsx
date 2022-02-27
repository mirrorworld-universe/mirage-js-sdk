import React from 'react';
import { Modal } from 'antd';

export const MetaplexModal = (props: any) => {
  const { children, bodyStyle, ...rest } = props;

  const content = (
    <div
      style={{
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 32,
      }}
    >
      {children}
    </div>
  );

  return (
    <Modal footer={null} width={400} {...rest}>
      {content}
    </Modal>
  );
};
