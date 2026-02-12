import React, { useState, useMemo, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, TableSortLabel, Paper, Typography,
    Box, Checkbox
} from '@mui/material';

// ─── Default header cell styles (matches existing codebase convention) ────────
const defaultHeaderCellSx = {
    color: '#000000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontSize: '0.75rem',
};

// ─── Stable sort utilities ───────────────────────────────────────────────────
function descendingComparator(a, b, orderBy, sortValueGetter) {
    let aValue, bValue;

    if (sortValueGetter) {
        aValue = sortValueGetter(a, orderBy);
        bValue = sortValueGetter(b, orderBy);
    } else {
        aValue = a[orderBy];
        bValue = b[orderBy];
    }

    // Handle null/undefined
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';

    // String comparison (case-insensitive)
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (bValue < aValue) return -1;
    if (bValue > aValue) return 1;
    return 0;
}

function getComparator(order, orderBy, sortValueGetter) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy, sortValueGetter)
        : (a, b) => -descendingComparator(a, b, orderBy, sortValueGetter);
}

function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

/**
 * DataTable — A reusable, configurable table component.
 *
 * @param {Object} props
 *
 * REQUIRED:
 * @param {Array}  props.columns           — Column definitions.
 *   Each column object may contain:
 *     id        {string}   — Unique column key (also used to read row[id] when no render fn is given).
 *     label     {string}   — Header text.
 *     sortable  {boolean}  — Whether this column is sortable (default false).
 *     sortKey   {string}   — Key used for sorting (defaults to `id`).
 *     render    {function} — (row, index) => ReactNode — custom cell renderer.
 *     headerSx  {object}   — Extra sx for the header TableCell.
 *     cellSx    {object}   — Extra sx for the body TableCell.
 *     align     {string}   — Cell alignment ('left' | 'center' | 'right').
 *     width     {string|number} — Column width.
 *     padding   {string}   — TableCell padding prop ('normal' | 'checkbox' | 'none').
 *
 * @param {Array}  props.data              — Array of row objects.
 *
 * SORTING (optional):
 * @param {string}   props.defaultSortColumn    — Initial sort column id.
 * @param {string}   props.defaultSortDirection — Initial sort direction ('asc' | 'desc'). Default 'asc'.
 * @param {function} props.sortValueGetter      — (row, orderBy) => value — Custom value extractor for sorting.
 * @param {string}   props.sortIndicator        — 'label' for MUI TableSortLabel, 'arrow' for ↑↓ text. Default 'label'.
 *
 * PAGINATION (optional):
 * @param {boolean}       props.pagination         — Enable pagination. Default false.
 * @param {Array<number>} props.rowsPerPageOptions  — Options for rows per page. Default [5, 10, 25, 50].
 * @param {number}        props.defaultRowsPerPage  — Default rows per page. Default 10.
 * @param {object}        props.paginationSx        — Extra sx for TablePagination.
 *
 * SELECTION (optional):
 * @param {boolean}  props.selectable         — Enable row selection checkboxes.
 * @param {Array}    props.selectedIds        — Controlled array of selected row IDs.
 * @param {function} props.onSelectionChange  — (newSelectedIds) => void.
 * @param {function} props.getRowId           — (row) => id. Default (row) => row.id.
 * @param {function} props.isRowSelectable    — (row) => boolean. Default () => true.
 *
 * ROW INTERACTION (optional):
 * @param {function} props.onRowClick — (row, event) => void.
 * @param {function} props.rowSx      — (row) => sx object for conditional row styling.
 * @param {boolean}  props.hoverEffect — Enable hover. Default true.
 *
 * APPEARANCE (optional):
 * @param {string}  props.headerBg          — Header row background. Default '#FAFAFA'.
 * @param {object}  props.headerRowSx       — Extra sx for the header TableRow.
 * @param {object}  props.headerCellSx      — Override for ALL header cells base sx.
 * @param {object}  props.paperSx           — Paper wrapper sx.
 * @param {object}  props.tableContainerSx  — TableContainer sx.
 * @param {object}  props.tableSx           — Table sx.
 * @param {string}  props.size              — 'small' | 'medium'. Default 'medium'.
 * @param {boolean} props.stickyHeader      — Sticky table header.
 * @param {boolean} props.showPaper         — Wrap in Paper. Default true.
 * @param {boolean} props.cellBorders       — Add right borders to cells.
 * @param {string}  props.borderColor       — Border color when cellBorders is true. Default '#e0e0e0'.
 *
 * EMPTY STATE (optional):
 * @param {string}    props.emptyMessage — Message when data is empty. Default 'No data found'.
 * @param {ReactNode} props.emptyIcon   — Icon rendered above the empty message.
 *
 * LOADING (optional):
 * @param {boolean} props.loading — Show nothing / allow parent to handle loading externally.
 */
function DataTable({
    // Required
    columns = [],
    data = [],

    // Sorting
    defaultSortColumn = '',
    defaultSortDirection = 'asc',
    sortValueGetter,
    sortIndicator = 'label',

    // Pagination
    pagination = false,
    rowsPerPageOptions = [5, 10, 25, 50],
    defaultRowsPerPage = 10,
    paginationSx,

    // Selection
    selectable = false,
    selectedIds = [],
    onSelectionChange,
    getRowId = (row) => row.id,
    isRowSelectable = () => true,

    // Row interaction
    onRowClick,
    rowSx,
    hoverEffect = true,

    // Appearance
    headerBg = '#FAFAFA',
    headerRowSx,
    headerCellSx: headerCellSxOverride,
    paperSx,
    tableContainerSx,
    tableSx,
    size = 'medium',
    stickyHeader = false,
    showPaper = true,
    cellBorders = false,
    borderColor = '#e0e0e0',

    // Empty state
    emptyMessage = 'No data found',
    emptyIcon,

    // Loading (parent handles spinner; this just prevents rendering rows)
    loading = false,
}) {
    // ── Internal sorting state ───────────────────────────────────────────────
    const [order, setOrder] = useState(defaultSortDirection);
    const [orderBy, setOrderBy] = useState(defaultSortColumn);

    // ── Internal pagination state ────────────────────────────────────────────
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

    // ── Sorting handler ──────────────────────────────────────────────────────
    const handleRequestSort = useCallback((columnId) => {
        const isAsc = orderBy === columnId && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(columnId);
    }, [order, orderBy]);

    // ── Sorted & paginated data ──────────────────────────────────────────────
    const sortedData = useMemo(() => {
        if (!orderBy) return data;
        // Determine the sort key: column may specify a custom sortKey
        const col = columns.find(c => c.id === orderBy);
        const actualSortKey = col?.sortKey || orderBy;
        return stableSort(data, getComparator(order, actualSortKey, sortValueGetter));
    }, [data, order, orderBy, columns, sortValueGetter]);

    const displayedData = useMemo(() => {
        if (!pagination) return sortedData;
        return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [sortedData, pagination, page, rowsPerPage]);

    // ── Reset page when data changes ────────────────────────────────────────
    React.useEffect(() => {
        // When the data array length changes (e.g. filtering), go back to page 0
        setPage(0);
    }, [data.length]);

    // ── Pagination handlers ──────────────────────────────────────────────────
    const handleChangePage = useCallback((_, newPage) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    // ── Selection helpers ────────────────────────────────────────────────────
    const selectableRows = useMemo(() => {
        return data.filter(isRowSelectable);
    }, [data, isRowSelectable]);

    const isAllSelected = selectable && selectableRows.length > 0 &&
        selectableRows.every(row => selectedIds.includes(getRowId(row)));

    const isSomeSelected = selectable && selectedIds.length > 0 && !isAllSelected;

    const handleSelectAll = useCallback((event) => {
        if (!onSelectionChange) return;
        if (event.target.checked) {
            const allSelectableIds = selectableRows.map(getRowId);
            onSelectionChange(allSelectableIds);
        } else {
            onSelectionChange([]);
        }
    }, [onSelectionChange, selectableRows, getRowId]);

    const handleToggleRow = useCallback((rowId, event) => {
        if (event) event.stopPropagation();
        if (!onSelectionChange) return;
        const currentIndex = selectedIds.indexOf(rowId);
        const newSelected = [...selectedIds];
        if (currentIndex === -1) {
            newSelected.push(rowId);
        } else {
            newSelected.splice(currentIndex, 1);
        }
        onSelectionChange(newSelected);
    }, [onSelectionChange, selectedIds]);

    // ── Compute total column count (for empty-state colSpan) ─────────────────
    const totalColumns = columns.length + (selectable ? 1 : 0);

    // ── Resolved header cell sx ──────────────────────────────────────────────
    const resolvedHeaderCellSx = headerCellSxOverride || defaultHeaderCellSx;

    // ── Cell border sx helper ────────────────────────────────────────────────
    const cellBorderSx = cellBorders ? { borderRight: `1px solid ${borderColor}` } : {};

    // ── Render sort indicator for a column ───────────────────────────────────
    const renderSortableHeader = (col) => {
        const sortKey = col.sortKey || col.id;
        if (sortIndicator === 'arrow') {
            return (
                <Box
                    component="span"
                    onClick={() => handleRequestSort(sortKey)}
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                >
                    {col.label} {orderBy === sortKey && (order === 'asc' ? '↑' : '↓')}
                </Box>
            );
        }
        // Default: MUI TableSortLabel
        return (
            <TableSortLabel
                active={orderBy === sortKey}
                direction={orderBy === sortKey ? order : 'asc'}
                onClick={() => handleRequestSort(sortKey)}
                sx={{
                    color: '#000000 !important',
                    '& .MuiTableSortLabel-icon': {
                        color: '#000000 !important',
                    },
                }}
            >
                {col.label}
            </TableSortLabel>
        );
    };

    // ── Build the table ──────────────────────────────────────────────────────
    const tableContent = (
        <>
            <TableContainer sx={tableContainerSx}>
                <Table size={size} stickyHeader={stickyHeader} sx={tableSx}>
                    {/* ── HEAD ─────────────────────────────────────────── */}
                    <TableHead>
                        <TableRow sx={{ backgroundColor: headerBg, ...headerRowSx }}>
                            {/* Selection checkbox header */}
                            {selectable && (
                                <TableCell
                                    padding="checkbox"
                                    sx={{
                                        ...resolvedHeaderCellSx,
                                        ...cellBorderSx,
                                    }}
                                >
                                    <Checkbox
                                        indeterminate={isSomeSelected}
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        sx={{
                                            color: '#000000',
                                            '&.Mui-checked': { color: '#000000' },
                                            '&.MuiCheckbox-indeterminate': { color: '#000000' },
                                        }}
                                    />
                                </TableCell>
                            )}

                            {/* Column headers */}
                            {columns.map((col) => (
                                <TableCell
                                    key={col.id}
                                    align={col.align || 'left'}
                                    padding={col.padding || 'normal'}
                                    sortDirection={orderBy === (col.sortKey || col.id) ? order : false}
                                    sx={{
                                        ...resolvedHeaderCellSx,
                                        ...cellBorderSx,
                                        ...(col.width != null ? { width: col.width } : {}),
                                        ...(col.sortable && sortIndicator === 'arrow' ? { cursor: 'pointer' } : {}),
                                        ...col.headerSx,
                                    }}
                                >
                                    {col.sortable
                                        ? renderSortableHeader(col)
                                        : col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    {/* ── BODY ─────────────────────────────────────────── */}
                    <TableBody>
                        {loading ? null : displayedData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={totalColumns} sx={{ textAlign: 'center', py: 4 }}>
                                    {emptyIcon && (
                                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                                            {emptyIcon}
                                        </Box>
                                    )}
                                    <Typography color="text.secondary">
                                        {emptyMessage}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayedData.map((row, rowIndex) => {
                                const rowId = getRowId(row);
                                const isSelected = selectable && selectedIds.includes(rowId);
                                const canSelect = selectable && isRowSelectable(row);
                                const conditionalRowSx = typeof rowSx === 'function' ? rowSx(row) : {};

                                return (
                                    <TableRow
                                        key={rowId ?? rowIndex}
                                        hover={hoverEffect}
                                        selected={isSelected}
                                        onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
                                        sx={{
                                            ...(onRowClick ? { cursor: 'pointer' } : {}),
                                            transition: 'background-color 0.2s',
                                            '&:hover': hoverEffect ? { backgroundColor: '#f5f5f5' } : {},
                                            ...conditionalRowSx,
                                        }}
                                    >
                                        {/* Selection checkbox */}
                                        {selectable && (
                                            <TableCell
                                                padding="checkbox"
                                                onClick={(e) => e.stopPropagation()}
                                                sx={cellBorderSx}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    disabled={!canSelect}
                                                    onChange={(e) => handleToggleRow(rowId, e)}
                                                    color="primary"
                                                />
                                            </TableCell>
                                        )}

                                        {/* Data cells */}
                                        {columns.map((col) => (
                                            <TableCell
                                                key={col.id}
                                                align={col.align || 'left'}
                                                padding={col.padding || 'normal'}
                                                sx={{
                                                    ...cellBorderSx,
                                                    ...col.cellSx,
                                                }}
                                            >
                                                {col.render
                                                    ? col.render(row, rowIndex)
                                                    : (row[col.id] ?? '')}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ── PAGINATION ──────────────────────────────────────── */}
            {pagination && data.length > 0 && (
                <TablePagination
                    rowsPerPageOptions={rowsPerPageOptions}
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    sx={paginationSx}
                />
            )}
        </>
    );

    // ── Wrap in Paper if requested ───────────────────────────────────────────
    if (showPaper) {
        return (
            <Paper
                sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    ...paperSx,
                }}
            >
                {tableContent}
            </Paper>
        );
    }

    return tableContent;
}

export default DataTable;
