import { useState } from "react";
import { Dropdown, DropdownToggle, DropdownItem } from "@patternfly/react-core";

const DropdownWithSearch = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const { fileNames, onSelectedValue } = props;
  const [dropdownValue, setDropdownValue] = useState("Select file");

  const onToggle = (isOpen) => {
    setIsOpen(isOpen);
  };

  const onFocus = () => {
    const element = document.getElementById("toggle-initial-selection");
    element.focus();
  };

  const onSelect = (e) => {
    const { onSelectedValue} = props;
    setIsOpen(false);
    setDropdownValue(e.target.innerText);
    onSelectedValue(e.target.innerText);
    onFocus();
  };

  const dropdownItems = fileNames?.map((fileName, index) => (
    <DropdownItem key={index}>{fileName}</DropdownItem>
  )) || <DropdownItem key='no-file'>No log files </DropdownItem>;

  return (
    <Dropdown
      onSelect={onSelect}
      toggle={
        <DropdownToggle id='toggle-initial-selection' onToggle={onToggle}>
          {dropdownValue}
        </DropdownToggle>
      }
      isOpen={isOpen}
      dropdownItems={dropdownItems}
    />
  );
};

export default DropdownWithSearch;
