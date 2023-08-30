import { useMemo } from 'react';
import {
    ColumnDef,
} from '@tanstack/react-table'
import { Table } from '../components/Table';
import { FaCheckCircle, FaEdit, FaPlus } from 'react-icons/fa';
import { AssessmentListItem} from '../types';
import { useGetAssessments } from '../api/services/Assessment';
import { Link } from 'react-router-dom';


function Assessments() {

    const cols = useMemo<ColumnDef<AssessmentListItem>[]>(
        () => [
            {
                header: ' ',
                footer: props => props.column.id,
                columns: [
                    {
                        accessorKey: 'id',
                        header: () => <span>ID</span>,
                        cell: info => info.getValue(),
                        footer: props => props.column.id,
                    },
                    {
                        accessorFn: row => row.created_on,
                        id: 'created_on',
                        cell: info => info.getValue(),
                        header: () => <span>Created On</span>,
                        footer: props => props.column.id,
                    },
                    {
                        accessorFn: row => row.validation_id,
                        id: 'validation_id',
                        cell: info => info.getValue(),
                        header: () => <span>Validation ID</span>,
                        footer: props => props.column.id,
                    },
                    {
                        accessorFn: row => row.template_id,
                        id: 'template_id',
                        cell: info => info.getValue(),
                        header: () => <span>Template ID</span>,
                        footer: props => props.column.id,
                    },
                    {
                        id: "action",
                        header: () => <span>Actions</span>,
                        cell: (props) => {
                          
                            return (
                              <div className="edit-buttons btn-group shadow">
                                <Link
                                  className="btn btn-secondary cat-action-view-link btn-sm "
                                  to={`/assessments/${props.row.original.id}`}>
                                  <FaEdit />
                                </Link>
                              </div>
                            )
                          
                        }
                    }
                ],
            },
        ],
        []
    )

    return (
        <div className="mt-4">
             <div className="d-flex justify-content-between my-2 container">
             <h3 className="cat-view-heading"><FaCheckCircle className="me-1"/> assessments</h3>
                 <Link to="/validations" className="btn btn-light border-black mx-3" ><FaPlus /> Create New</Link>
            </div>
            <Table columns={cols} data_source={useGetAssessments} />
        </div>
    );
}

export default Assessments;