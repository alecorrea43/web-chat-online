import React, { useState } from "react";
import { IconButton, Menu, MenuItem} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const DropdownMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setIsDropdownOpen(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setIsDropdownOpen(false);
    
  };

  const handleMenuItemClick = (event) => {
    handleMenuClose();
 
  };

  return (
    <div>
      <IconButton onClick={handleMenuOpen}
      color="inherit"
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={isDropdownOpen}
        onClose={handleMenuClose}
      >
           <MenuItem onClick={handleMenuItemClick}>Delete chat</MenuItem>
        <MenuItem onClick={handleMenuItemClick}>Block user</MenuItem>
      </Menu>
    </div>
  );
};

export default DropdownMenu;